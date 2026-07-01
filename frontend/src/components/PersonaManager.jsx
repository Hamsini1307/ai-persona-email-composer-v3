import { useState } from "react";

const emptyForm = { name: "", system_prompt: "" };

export default function PersonaManager({
  personas,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  selectedId,
  onSelect,
}) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const isEditing = editingId !== null;

  function startEdit(persona) {
    setEditingId(persona._id);
    setForm({ name: persona.name, system_prompt: persona.system_prompt });
    setFormError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.system_prompt.trim()) {
      setFormError("Both persona name and behavior instructions are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await onUpdate(editingId, form);
      } else {
        await onCreate(form);
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await onDelete(id);
      if (editingId === id) cancelEdit();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      {/* Persona list */}
      <div className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[15px] font-semibold text-ink">Saved personas</h2>
          <p className="mt-0.5 text-xs text-muted">Select one to use in the composer, or edit/remove below.</p>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-muted">Loading personas…</div>
        ) : personas.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted">
            No personas yet. Create your first one using the form.
          </div>
        ) : (
          <ul className="divide-y divide-line max-h-[420px] overflow-y-auto">
            {personas.map((p) => (
              <li
                key={p._id}
                className={`px-5 py-3.5 transition-colors ${
                  selectedId === p._id ? "bg-accentSoft" : "hover:bg-paper"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onSelect(p._id)}
                    className="flex-1 text-left"
                    aria-pressed={selectedId === p._id}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          selectedId === p._id ? "bg-accent" : "bg-line"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-sm text-ink">{p.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted line-clamp-2 pl-3.5">{p.system_prompt}</p>
                  </button>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      className="text-xs font-medium text-[#A33B3B] hover:underline disabled:opacity-50"
                    >
                      {deletingId === p._id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create / edit form */}
      <div className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[15px] font-semibold text-ink">
            {isEditing ? "Edit persona" : "New persona"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {isEditing
              ? "Update the name or behavior instructions below."
              : "Define a name and behavior instructions for the AI to follow."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {formError && (
            <p className="rounded-md bg-[#FBEAEA] border border-[#E5A0A0] px-3 py-2 text-xs font-medium text-[#8A2E2E]">
              {formError}
            </p>
          )}

          <div>
            <label htmlFor="persona-name" className="block text-xs font-semibold text-ink mb-1.5">
              Persona name
            </label>
            <input
              id="persona-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Polite Assistant"
              maxLength={100}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:bg-white"
            />
          </div>

          <div>
            <label htmlFor="persona-prompt" className="block text-xs font-semibold text-ink mb-1.5">
              Behavior instructions (system prompt)
            </label>
            <textarea
              id="persona-prompt"
              value={form.system_prompt}
              onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))}
              placeholder="e.g. You are a helpful and very polite office assistant. Use professional language and keep your emails friendly and clear."
              rows={6}
              maxLength={4000}
              className="w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:bg-white"
            />
            <p className="mt-1 text-right text-[11px] text-muted">{form.system_prompt.length}/4000</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? (isEditing ? "Saving…" : "Creating…") : isEditing ? "Save changes" : "Create persona"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
