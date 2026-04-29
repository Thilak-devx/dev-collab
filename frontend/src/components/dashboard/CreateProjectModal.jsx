import { useEffect, useState } from "react";
import { X } from "lucide-react";

const initialValues = {
  name: "",
  description: "",
};

export default function CreateProjectModal({ open, onClose, onSubmit, loading, error }) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    if (!open) {
      setValues(initialValues);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/92 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
              New project
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">Create project</h2>
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
            <span className="mb-2 block text-sm text-text-muted">Project name</span>
            <input
              className="h-11 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
              name="name"
              onChange={handleChange}
              placeholder="Platform redesign"
              value={values.name}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-text-muted">Description</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 py-3 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
              name="description"
              onChange={handleChange}
              placeholder="Describe the goal, scope, and collaborators."
              value={values.description}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <button
              className="h-10 rounded-xl border border-white/8 px-4 text-sm text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
