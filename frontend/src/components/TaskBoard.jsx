import { useEffect, useState } from "react";

const columns = [
  { key: "todo", title: "Todo", accent: "text-sky-300" },
  { key: "in-progress", title: "In Progress", accent: "text-amber-300" },
  { key: "done", title: "Done", accent: "text-emerald-300" },
];

const nextStatusMap = {
  todo: "in-progress",
  "in-progress": "done",
  done: null,
};

const prevStatusMap = {
  todo: null,
  "in-progress": "todo",
  done: "in-progress",
};

function TaskCard({ task, onMove }) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-white">{task.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {task.description || "No description added yet."}
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
          {task.status}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Assigned to</p>
          <p className="mt-1 text-sm font-medium text-slate-200">
            {task.assignedTo?.name || "Unassigned"}
          </p>
        </div>
        <div className="flex gap-2">
          {prevStatusMap[task.status] ? (
            <button
              className="rounded-2xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-aqua hover:text-aqua"
              onClick={() => onMove(task._id, prevStatusMap[task.status])}
              type="button"
            >
              Back
            </button>
          ) : null}
          {nextStatusMap[task.status] ? (
            <button
              className="rounded-2xl bg-aqua px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal-300"
              onClick={() => onMove(task._id, nextStatusMap[task.status])}
              type="button"
            >
              Move
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function TaskBoard({ initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const moveTask = (taskId, nextStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task._id === taskId
          ? {
              ...task,
              status: nextStatus,
            }
          : task
      )
    );
  };

  return (
    <section className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ember">
            Task board
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Kanban workflow</h3>
        </div>
        <span className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-400">
          Move tasks across stages
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);

          return (
            <div
              key={column.key}
              className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${column.accent}`}>
                    {column.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {columnTasks.length} {columnTasks.length === 1 ? "task" : "tasks"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {columnTasks.length ? (
                  columnTasks.map((task) => (
                    <TaskCard key={task._id} onMove={moveTask} task={task} />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-500">
                    No tasks in this column.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
