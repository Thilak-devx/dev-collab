import { CalendarDays, CheckCircle2, Trash2 } from "lucide-react";
import EmptyState from "./EmptyState";

const statusOrder = ["todo", "in_progress", "done"];

const statusLabels = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const statusPills = {
  todo: "status-pill status-pill-todo",
  in_progress: "status-pill status-pill-progress",
  done: "status-pill status-pill-done",
};

const priorityStyles = {
  low: "priority-pill priority-pill-low",
  medium: "priority-pill priority-pill-medium",
  high: "priority-pill priority-pill-high",
  urgent: "priority-pill priority-pill-urgent",
};

const formatDueDate = (value) => {
  if (!value) {
    return "No due date";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function TaskList({
  tasks,
  emptyTitle,
  emptyDescription,
  onStatusChange,
  onDeleteTask,
  actionLoadingId,
  projectNameVisible = true,
}) {
  if (!tasks.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <article
          key={task._id}
          className="app-row-hover p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <CheckCircle2
                  className={`h-4.5 w-4.5 ${
                    task.status === "done" ? "text-emerald-300" : "text-text-subtle"
                  }`}
                />
                <h3 className="text-sm font-semibold text-text-primary">{task.title}</h3>
                <span className={statusPills[task.status] || statusPills.todo}>
                  {statusLabels[task.status]}
                </span>
                <span className={priorityStyles[task.priority] || priorityStyles.medium}>
                  {task.priority || "medium"}
                </span>
              </div>
              <p className="mt-2 app-muted-copy">
                {task.description || "No description added yet."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-subtle">
                <span className="font-medium text-slate-300">
                  {task.assignedTo?.name || "Unassigned"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDueDate(task.dueDate)}
                </span>
                {projectNameVisible && task.projectId?.name ? (
                  <span className="text-slate-400">{task.projectId.name}</span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {statusOrder.map((status) => (
                <button
                  key={status}
                  className={`h-9 rounded-xl px-3 text-xs font-medium transition ${
                    task.status === status
                      ? "border border-sky-400/20 bg-sky-400/10 text-sky-100"
                      : "border border-white/8 bg-slate-950/70 text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
                  }`}
                  disabled={actionLoadingId === task._id}
                  onClick={() => onStatusChange(task, status)}
                  type="button"
                >
                  {statusLabels[status]}
                </button>
              ))}

              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-slate-950/70 text-text-muted transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-200"
                disabled={actionLoadingId === task._id}
                onClick={() => onDeleteTask(task)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
