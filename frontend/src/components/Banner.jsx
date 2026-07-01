export default function Banner({ tone = "error", children, onDismiss }) {
  const tones = {
    error: "bg-[#FBEAEA] border-[#E5A0A0] text-[#8A2E2E]",
    success: "bg-[#EAF6EC] border-[#9FD3AB] text-[#2A6B3D]",
    info: "bg-accentSoft border-accent/30 text-[#28379E]",
  };

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm font-medium ${tones[tone]}`}
    >
      <span className="leading-relaxed">{children}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}
