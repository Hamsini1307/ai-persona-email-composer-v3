# Persona Email Composer

A full-stack CRUD application that lets users define reusable AI "Personas" and use them to generate objective-driven email replies via the Google Gemini API.

Built for The Go Web technical assessment.

---

## Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React.js (Vite) + Tailwind CSS        |
| Backend    | Express.js (Node.js)                 |
| Database   | MongoDB (Mongoose)                   |
| AI         | Google Gemini API (`gemini-1.5-flash`) |

---

## Project Structure

```
the-go-web-assessment/
├── backend/
│   ├── src/
│   │   ├── config/        # DB connection, Gemini client setup
│   │   ├── controllers/    # Persona CRUD + Gemini generation logic
│   │   ├── middleware/     # Centralized error handling
│   │   ├── models/         # Mongoose Persona schema
│   │   ├── routes/         # Express route definitions
│   │   └── server.js        # App entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # PersonaManager, Composer, Banner
    │   ├── services/        # api.js — fetch wrapper for backend calls
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    └── package.json
```

---

## Setup & Run Locally

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env and fill in MONGO_URI and GEMINI_API_KEY
npm install
npm run dev      # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# edit .env if your backend runs on a different URL
npm install
npm run dev      # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser. The app loads with the "Compose" tab; switch to "Manage personas" to create your first persona.

---

## How It Works

### 1. Gemini API requests and response generation

The generation endpoint (`POST /api/generate`) lives in `backend/src/controllers/generateController.js`. For each request:

1. The client sends `{ personaId, raw_email, objective }`.
2. The backend looks up the persona document in MongoDB by `personaId` to retrieve its `system_prompt`.
3. A `GoogleGenerativeAI` client is instantiated per-request via `genAI.getGenerativeModel({ model, systemInstruction })`, using the official `@google/generative-ai` SDK.
4. The incoming email and objective are combined into a single **user-turn prompt** (see `buildUserPrompt`), which explicitly frames the task: "reply to this email, achieving this objective, while staying in character."
5. `model.generateContent(...)` is called with `temperature: 0.7` and `maxOutputTokens: 1024` — a balance between creative phrasing and predictable, on-topic output.
6. The generated text is extracted via `result.response.text()`, trimmed, and returned to the frontend as `generated_reply`.

The Gemini API key never reaches the browser — all calls happen server-side, keeping the key secure.

### 2. Persona storage, retrieval, update, and deletion

Personas are stored in MongoDB using a Mongoose schema (`backend/src/models/Persona.js`) with two user-facing fields — `name` and `system_prompt` — plus Mongoose's auto-generated `_id` and timestamps.

All CRUD operations live in `backend/src/controllers/personaController.js` and are exposed via REST routes under `/api/personas`:

| Method | Route              | Action                          |
|--------|---------------------|----------------------------------|
| POST   | `/api/personas`      | Create a new persona            |
| GET    | `/api/personas`      | List all personas                |
| GET    | `/api/personas/:id`  | Fetch a single persona by ID      |
| PUT    | `/api/personas/:id`  | Update name and/or system_prompt  |
| DELETE | `/api/personas/:id`  | Delete a persona by ID            |

On the frontend, `PersonaManager.jsx` provides the UI for all four operations: a form for create/edit (the same form switches modes when "Edit" is clicked on an existing persona), and a list with inline "Edit" / "Remove" actions. State is kept in sync optimistically — after each successful API call, the local `personas` array in `App.jsx` is updated directly from the response rather than re-fetching the full list.

### 3. Mapping `system_prompt` to Gemini's `system_instruction`

This mapping happens at the point the model is instantiated:

```js
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: persona.system_prompt,
});
```

The persona's `system_prompt` — exactly as stored in MongoDB, with no modification — is passed as Gemini's native `systemInstruction` parameter. This is what the Gemini API uses to govern tone, vocabulary, and formatting for the entire response, separate from the task-specific content (the email and objective) sent in the user turn. This separation is intentional: it keeps "who is speaking" (the persona) cleanly decoupled from "what they're being asked to do" (the task), which is also why switching personas for the same email/objective produces consistently different voices without changing any other part of the prompt.

### 4. Validation, error handling, and fallback mechanisms

**Input validation** (both layers):
- Backend rejects empty/missing `name`, `system_prompt`, `personaId`, `raw_email`, or `objective` with `400` responses and specific messages.
- Persona `id` params are checked with `mongoose.Types.ObjectId.isValid()` before any DB query, avoiding cast-error crashes.
- Mongoose schema-level constraints (`minlength`, `maxlength`, `required`) provide a second line of defense and surface as `400` with the Mongoose validation message.
- Frontend forms block submission client-side for empty required fields, and the textarea for `system_prompt` shows a live character counter against the 4000-char limit.

**Error handling**:
- Every controller method is wrapped in `try/catch`, returning a consistent `{ success: false, message }` shape.
- A global Express error-handling middleware (`backend/src/middleware/errorHandler.js`) catches anything unhandled, including malformed JSON bodies, and a `404` handler covers unknown routes.
- The frontend's `services/api.js` wraps every `fetch` call, throwing a readable `Error` whenever the response is non-2xx or the network request itself fails (e.g., backend not running), so the UI never silently fails.

**Gemini-specific fallbacks**:
- If `GEMINI_API_KEY` is missing from the environment, the generate endpoint short-circuits with a clear `500` instead of letting the SDK throw an opaque error.
- If Gemini returns an empty response (e.g., blocked by safety filters), the API returns a `502` with a message suggesting the user rephrase their input, rather than showing a blank result.
- Known Gemini error patterns (invalid API key, quota/rate-limit exceeded, network/timeout issues) are pattern-matched in the `catch` block and translated into specific, actionable messages instead of a generic "server error."

---

## Sample Test Case

**Persona:** Polite Assistant
**System Prompt:** "You are a helpful and very polite office assistant. Use professional language and keep your emails friendly and clear."

**Raw Email:**
> Hello, I am interested in buying 50 laptops for my school. Can we have a phone call tomorrow at 10:00 AM to discuss the prices?

**Objective:** "Say yes to the meeting. Ask them to share their phone number so we can call them."

Running this through the app's Compose tab produces a reply matching the tone and content of the expected output in the assessment brief — confirming the persona, the email, and the objective are all flowing into the Gemini call correctly.

---

## Notes on Choices Made

- **MongoDB over PostgreSQL**: chosen for schema simplicity — a persona is a simple two-field document with no relational structure needed.
- **Express.js over the other backend options**: minimal boilerplate, well-suited to a small number of REST endpoints plus one AI-integration endpoint.
- **Per-request model instantiation**: `genAI.getGenerativeModel()` is called fresh inside each request (rather than once globally) so the `systemInstruction` always reflects the persona selected for that specific call, with no risk of state leaking between concurrent requests for different personas.
