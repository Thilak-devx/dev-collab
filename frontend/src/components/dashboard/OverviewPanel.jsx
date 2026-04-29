import { CheckCircle2, FolderGit2, Users2 } from "lucide-react";
import SectionHeader from "./SectionHeader";

export default function OverviewPanel({ projects, tasks, user }) {
  const ownedCount = projects.filter(
    (project) => project.owner?.id === user?.id || project.owner?._id === user?.id
  ).length;
  const memberCount = new Set(
    projects.flatMap((project) => (project.members || []).map((member) => member.email || member._id))
  ).size;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const dueSoonTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status === "done") {
      return false;
    }

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const diffInMs = dueDate.getTime() - now.getTime();

    return diffInMs >= 0 && diffInMs <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const insights = [
    {
      label: "Owned projects",
      value: ownedCount,
      icon: FolderGit2,
    },
    {
      label: "Team reach",
      value: memberCount,
      icon: Users2,
    },
    {
      label: "Completed tasks",
      value: completedTasks,
      icon: CheckCircle2,
    },
    {
      label: "Due this week",
      value: dueSoonTasks,
      icon: FolderGit2,
    },
  ];

  return (
    <section className="app-panel-secondary p-5">
      <SectionHeader label="Overview" title="Workspace summary" />
      <div className="space-y-3">
        {insights.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="app-row-hover flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/85 text-brand-300">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm text-text-muted">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-text-primary">{item.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
