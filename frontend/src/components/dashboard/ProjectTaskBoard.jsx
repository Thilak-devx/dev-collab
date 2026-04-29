import { CalendarDays, Plus, UserRound } from "lucide-react";
import EmptyState from "./EmptyState";

const columns = [
  {
    id: "todo",
    label: "Todo",
    accent: "bg-slate-400/70",
  },
  {
    id: "in_progress",
    label: "In Progress",
    accent: "bg-sky-400/80",
  },
  {
    id: "done",
    label: "Done",
    accent: "bg-emerald-400/80",
  },
];

const priorityStyles = {
  low: "priority-pill priority-pill-low",
  medium: "priority-pill priority-pill-medium",
  high: "priority-pill priority-pill-high",
  urgent: "priority-pill priority-pill-urgent",
};

const formatDueDate = (value) => {
  if (!value) {
    return "No deadline";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function ProjectTaskBoard({
  tasks,
  onTaskClick,
  onCreateTask,
}) {
  const groupedTasks = columns.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.id),
  }));

  if (!tasks.length) {
    return (
      <EmptyState
        action={(
          <button
            className="app-primary-button h-11 rounded-xl px-4 text-sm font-medium text-white"
            onClick={onCreateTask}
            type="button"
          >
            Create task
          </button>
        )}
        description="Create your first task to start planning work across Todo, In Progress, and Done."
        title="No tasks yet — create one"
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {groupedTasks.map((column) => (
        <section
          key={column.id}
          className="app-panel-secondary flex min-h-[420px] flex-col p-4"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${column.accent}`} />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{column.label}</h3>
                <p className="text-xs text-text-subtle">{column.tasks.length} tasks</p>
              </div>
            </div>

            {column.id === "todo" ? (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-text-muted transition hover:bg-white/[0.07] hover:text-text-primary"
                onClick={onCreateTask}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            {column.tasks.length ? (
              column.tasks.map((task) => (
                <button
                  key={task._id}
                  className="w-full rounded-2xl border border-white/8 bg-slate-950/80 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:-translate-y-0.5 hover:border-white/12 hover:bg-slate-900/90"
                  onClick={() => onTaskClick(task)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold leading-6 text-text-primary">
                      {task.title}
                    </h4>
                    <span className={priorityStyles[task.priority] || priorityStyles.medium}>
                      {task.priority || "medium"}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-muted">
                    {task.description || "No description added yet."}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-subtle">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5" />
                      {task.assignedTo?.name || "Unassigned"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-8 text-center">
                <p className="text-sm font-medium text-text-primary">No tasks here</p>
                <p className="mt-2 text-sm text-text-muted">
                  Move work into {column.label.toLowerCase()} to keep the board flowing.
                </p>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
