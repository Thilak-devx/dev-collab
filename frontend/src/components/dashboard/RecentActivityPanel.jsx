import { CheckCircle2, FolderOpenDot, SquareKanban } from "lucide-react";
import SectionHeader from "./SectionHeader";

const formatRelativeTime = (value) => {
  const date = new Date(value);
  const diffInMs = Date.now() - date.getTime();
  const diffInMinutes = Math.max(Math.floor(diffInMs / (1000 * 60)), 0);

  if (diffInMinutes < 1) {
    return "just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const getActivityMeta = (activity) => {
  switch (activity.type) {
    case "project_created":
      return {
        icon: FolderOpenDot,
        accent: "text-sky-300",
      };
    case "member_invited":
      return {
        icon: FolderOpenDot,
        accent: "text-violet-300",
      };
    case "task-completed":
    case "task_completed":
      return {
        icon: CheckCircle2,
        accent: "text-emerald-300",
      };
    case "task-updated":
    case "task_updated":
    case "task_created":
    case "task_deleted":
      return {
        icon: SquareKanban,
        accent: "text-brand-300",
      };
    default:
      return {
        icon: FolderOpenDot,
        accent: "text-sky-300",
      };
  }
};

export default function RecentActivityPanel({ activities }) {
  const getInitials = (name = "DC") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  return (
    <section className="app-panel-primary p-5">
      <SectionHeader label="Activity" title="Recent activity" />

      {activities.length ? (
        <div className="space-y-3">
          {activities.map((activity) => {
            const { icon: Icon, accent } = getActivityMeta(activity);
            const actorName = activity.userId?.name || "Workspace";

            return (
              <article
                key={activity._id || activity.id}
                className="app-row-hover px-4 py-3"
              >
                <div className="flex gap-3">
                  <span className="app-avatar h-10 w-10 shrink-0">
                    {getInitials(actorName)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{actorName}</p>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.05] ${accent}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        {formatRelativeTime(activity.timestamp || activity.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {activity.message || activity.description}
                    </p>
                    {activity.projectId?.name ? (
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {activity.projectId.name}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-10 text-center">
          <p className="text-sm font-medium text-text-primary">No activity yet</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Create a project, invite someone, or update a task to start building the activity trail.
          </p>
        </div>
      )}
    </section>
  );
}
