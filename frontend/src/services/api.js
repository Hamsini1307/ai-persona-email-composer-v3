const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Thin wrapper around fetch that throws a readable Error on non-2xx
 * responses, using the backend's { success, message } error shape.
 */
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkErr) {
    throw new Error(
      "Could not reach the server. Check that the backend is running and that your network connection is active."
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Server returned an unreadable response (status ${response.status}).`);
  }

  if (!response.ok || body.success === false) {
    throw new Error(body.message || `Request failed with status ${response.status}.`);
  }

  return body;
}

// ---- Persona CRUD ----
export const personaApi = {
  list: () => request("/personas"),
  create: (data) => request("/personas", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/personas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/personas/${id}`, { method: "DELETE" }),
};

// ---- Generation ----
export const generateApi = {
  generate: (payload) => request("/generate", { method: "POST", body: JSON.stringify(payload) }),
};
