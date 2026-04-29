import { useEffect, useState } from "react";
import { X } from "lucide-react";

const initialValues = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
};

export default function CreateTaskModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  members = [],
  initialValues: providedValues = initialValues,
  title = "Create task",
  eyebrow = "New task",
  submitLabel = "Create task",
}) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    if (open) {
      setValues({
        ...initialValues,
        ...providedValues,
        dueDate: providedValues?.dueDate
          ? new Date(providedValues.dueDate).toISOString().slice(0, 10)
          : "",
        assignedTo: providedValues?.assignedTo?._id || providedValues?.assignedTo || "",
      });
      return;
    }

    setValues(initialValues);
  }, [open, providedValues]);

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
    onSubmit({
      ...values,
      assignedTo: values.assignedTo || null,
      dueDate: values.dueDate || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/92 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
              {eyebrow}
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

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-text-muted">Task title</span>
            <input
              className="h-11 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
              name="title"
              onChange={handleChange}
              placeholder="Prepare sprint notes"
              value={values.title}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-text-muted">Description</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 py-3 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
              name="description"
              onChange={handleChange}
              placeholder="Add context for the task."
              value={values.description}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-text-muted">Status</span>
              <select
                className="h-11 w-full rounded-xl border border-white/8 bg-slate-950 px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                name="status"
                onChange={handleChange}
                value={values.status}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-text-muted">Priority</span>
              <select
                className="h-11 w-full rounded-xl border border-white/8 bg-slate-950 px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                name="priority"
                onChange={handleChange}
                value={values.priority}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-text-muted">Due date</span>
              <input
                className="h-11 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                name="dueDate"
                onChange={handleChange}
                type="date"
                value={values.dueDate}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-text-muted">Assign to</span>
              <select
                className="h-11 w-full rounded-xl border border-white/8 bg-slate-950 px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                name="assignedTo"
                onChange={handleChange}
                value={values.assignedTo}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
              className="h-10 rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
