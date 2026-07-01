import { useState } from "react";

export default function Composer({ personas, selectedId, onSelect, onGenerate }) {
  const [rawEmail, setRawEmail] = useState("");
  const [objective, setObjective] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedPersona = personas.find((p) => p._id === selectedId);

  async function handleGenerate() {
    setError("");
    setCopied(false);

    if (!selectedId) {
      setError("Please select a persona before generating a response.");
      return;
    }
    if (!rawEmail.trim()) {
      setError("Please paste the incoming email you want to respond to.");
      return;
    }
    if (!objective.trim()) {
      setError("Please describe the objective for this reply.");
      return;
    }

    setGenerating(true);
    setResult("");
    try {
      const res = await onGenerate({ personaId: selectedId, raw_email: rawEmail, objective });
      setResult(res.data.generated_reply);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard. Please select and copy the text manually.");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Input column */}
      <div className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[15px] font-semibold text-ink">Compose</h2>
          <p className="mt-0.5 text-xs text-muted">Select a persona, paste the email, and state your objective.</p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label htmlFor="persona-select" className="block text-xs font-semibold text-ink mb-1.5">
              Persona
            </label>
            <select
              id="persona-select"
              value={selectedId || ""}
              onChange={(e) => onSelect(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus-visible:bg-white"
            >
              <option value="" disabled>
                {personas.length === 0 ? "No personas available — create one first" : "Choose a persona…"}
              </option>
              {personas.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {selectedPersona && (
              <p className="mt-1.5 text-[11px] text-muted line-clamp-2">{selectedPersona.system_prompt}</p>
            )}
          </div>

          <div>
            <label htmlFor="raw-email" className="block text-xs font-semibold text-ink mb-1.5">
              Incoming email
            </label>
            <textarea
              id="raw-email"
              value={rawEmail}
              onChange={(e) => setRawEmail(e.target.value)}
              placeholder="Paste the email you received…"
              rows={7}
              className="w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:bg-white"
            />
          </div>

          <div>
            <label htmlFor="objective" className="block text-xs font-semibold text-ink mb-1.5">
              Objective for this reply
            </label>
            <textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Say yes to the meeting. Ask them to share their phone number."
              rows={3}
              className="w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:bg-white"
            />
          </div>

          {error && (
            <p className="rounded-md bg-[#FBEAEA] border border-[#E5A0A0] px-3 py-2 text-xs font-medium text-[#8A2E2E]">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate reply"}
          </button>
        </div>
      </div>

      {/* Output column */}
      <div className="rounded-lg border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-ink">Generated reply</h2>
            <p className="mt-0.5 text-xs text-muted">
              {selectedPersona ? `Voiced as "${selectedPersona.name}"` : "Output will appear here"}
            </p>
          </div>
          {result && (
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          {generating ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted">
              Asking Gemini to draft a response…
            </div>
          ) : result ? (
            <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-ink">{result}</pre>
          ) : (
            <div className="flex h-48 items-center justify-center text-center text-sm text-muted">
              Fill in the form and click "Generate reply" to see the AI-drafted email here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
