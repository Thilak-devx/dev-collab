import { useEffect, useState } from "react";
import { Hash, X } from "lucide-react";

export default function CreateChannelModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  submitDisabled = false,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!name.trim() || submitDisabled) {
      return;
    }

    onSubmit({ name: name.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/92 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Channel
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">Create channel</h2>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
            onClick={onClose}
            type="button"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-text-muted">Channel name</span>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              <input
                className="app-input h-11 w-full pl-10 pr-3.5"
                onChange={(event) => setName(event.target.value)}
                placeholder="design-review"
                value={name}
                required
              />
            </div>
          </label>

          <p className="text-sm leading-6 text-text-muted">
            Use channels to keep conversations organized by team, topic, or workstream.
          </p>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <button
              className="h-10 rounded-xl border border-white/8 px-4 text-sm text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
              disabled={loading}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="app-primary-button h-10 rounded-xl px-4 text-sm font-medium text-white"
              disabled={!name.trim() || submitDisabled || loading}
              type="submit"
            >
              {loading ? "Creating..." : "Create channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
