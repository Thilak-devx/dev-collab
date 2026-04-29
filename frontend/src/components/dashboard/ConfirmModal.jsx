import { X } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  loading,
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  const buttonTone =
    tone === "danger"
      ? "bg-red-500 text-white hover:bg-red-400"
      : "bg-gradient-to-r from-brand-600 to-blue-500 text-white hover:brightness-110";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/92 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Confirm action
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">{title}</h2>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
            onClick={onClose}
            type="button"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-text-muted">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="h-10 rounded-xl border border-white/8 px-4 text-sm text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
            disabled={loading}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`h-10 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${buttonTone}`}
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
