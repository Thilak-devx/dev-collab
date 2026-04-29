export default function ProjectCard({ project, isActive, onSelect }) {
  return (
    <button
      className={`w-full rounded-3xl border p-6 text-left transition ${
        isActive
          ? "border-aqua bg-slate-900 shadow-panel"
          : "border-slate-800 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-900"
      }`}
      onClick={() => onSelect(project)}
      type="button"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-aqua">Project</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{project.title}</h3>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          {project.members?.length || 0} members
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-400">
        {project.description || "No description added yet."}
      </p>
      <div className="mt-5 text-xs uppercase tracking-[0.25em] text-slate-500">
        Owner: {project.owner?.name || "Unknown"}
      </div>
    </button>
  );
}
