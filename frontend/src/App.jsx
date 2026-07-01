import { useEffect, useState, useCallback } from "react";
import PersonaManager from "./components/PersonaManager.jsx";
import Composer from "./components/Composer.jsx";
import Banner from "./components/Banner.jsx";
import { personaApi, generateApi } from "./services/api.js";

export default function App() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("compose"); // 'compose' | 'manage'
  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState("");

  const loadPersonas = useCallback(async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await personaApi.list();
      setPersonas(res.data);
      // keep selection valid if the selected persona was deleted elsewhere
      setSelectedId((prev) => (res.data.some((p) => p._id === prev) ? prev : res.data[0]?._id || null));
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  function flashToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleCreate(data) {
    const res = await personaApi.create(data);
    setPersonas((prev) => [res.data, ...prev]);
    setSelectedId(res.data._id);
    flashToast("Persona created.");
    return res;
  }

  async function handleUpdate(id, data) {
    const res = await personaApi.update(id, data);
    setPersonas((prev) => prev.map((p) => (p._id === id ? res.data : p)));
    flashToast("Persona updated.");
    return res;
  }

  async function handleDelete(id) {
    await personaApi.remove(id);
    setPersonas((prev) => prev.filter((p) => p._id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
    flashToast("Persona removed.");
  }

  async function handleGenerate(payload) {
    return generateApi.generate(payload);
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">Persona Email Composer</h1>
            <p className="text-xs text-muted mt-0.5">AI-drafted replies, written in a voice you define</p>
          </div>
          <nav className="flex gap-1 rounded-md border border-line bg-paper p-1">
            <button
              onClick={() => setTab("compose")}
              className={`rounded-[5px] px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === "compose" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Compose
            </button>
            <button
              onClick={() => setTab("manage")}
              className={`rounded-[5px] px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === "manage" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Manage personas
            </button>
          </nav>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {globalError && (
          <div className="mb-6">
            <Banner tone="error" onDismiss={() => setGlobalError("")}>
              {globalError}
            </Banner>
          </div>
        )}

        {!loading && personas.length === 0 && tab === "compose" && (
          <div className="mb-6">
            <Banner tone="info">
              You don't have any personas yet. Switch to "Manage personas" to create your first one.
            </Banner>
          </div>
        )}

        {tab === "compose" ? (
          <Composer
            personas={personas}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onGenerate={handleGenerate}
          />
        ) : (
          <PersonaManager
            personas={personas}
            loading={loading}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </main>
    </div>
  );
}
