import { ArrowUpRight, FolderOpenDot } from "lucide-react";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

export default function ProjectsPanel({ projects, onViewAll, onProjectOpen }) {
  return (
    <section className="app-panel-primary p-5">
      <SectionHeader
        label="Projects"
        title="Workspace projects"
        action={
          <button
            className="text-sm font-medium text-brand-300 transition hover:text-brand-200"
            onClick={onViewAll}
            type="button"
          >
            View all
          </button>
        }
      />

      {projects.length ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <article
              key={project._id}
              className="app-row-hover flex items-start justify-between gap-4 px-4 py-4"
            >
              <button className="min-w-0 flex-1 text-left" onClick={() => onProjectOpen(project)} type="button">
                <div className="flex items-center gap-2">
                  <FolderOpenDot className="h-4.5 w-4.5 text-brand-300" />
                  <h3 className="truncate text-[15px] font-semibold text-text-primary">{project.name}</h3>
                </div>
                <p className="mt-2 line-clamp-2 app-muted-copy">
                  {project.description || "No description added yet."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-subtle">
                  <span>{project.members?.length || 1} members</span>
                  <span>Owner: {project.owner?.name || "Unknown"}</span>
                </div>
              </button>
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
                onClick={() => onProjectOpen(project)}
                type="button"
              >
                <ArrowUpRight className="h-4.5 w-4.5" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          description="Create your first project to start organizing work."
          title="No projects yet"
        />
      )}
    </section>
  );
}
