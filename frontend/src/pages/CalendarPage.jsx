import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import TaskDetailsDrawer from "../components/dashboard/TaskDetailsDrawer";
import EmptyState from "../components/dashboard/EmptyState";
import SectionHeader from "../components/dashboard/SectionHeader";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";

const monthWeekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const viewTabs = [
  { id: "month", label: "Monthly", icon: LayoutGrid },
  { id: "week", label: "Weekly", icon: Rows3 },
];

const taskStatusLabels = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const statusTone = {
  todo: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  in_progress: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  done: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
};

const priorityStyles = {
  low: "priority-pill priority-pill-low",
  medium: "priority-pill priority-pill-medium",
  high: "priority-pill priority-pill-high",
  urgent: "priority-pill priority-pill-urgent",
};

const formatDateKey = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMonthLabel = (date) =>
  date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

const formatWeekRange = (startDate, endDate) =>
  `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

const startOfMonthGrid = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const buildMonthGrid = (date) => {
  const start = startOfMonthGrid(date);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

const startOfWeek = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
};

const buildWeekDays = (date) => {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

const isSameDay = (first, second) =>
  first.getFullYear() === second.getFullYear()
  && first.getMonth() === second.getMonth()
  && first.getDate() === second.getDate();

const isSameMonth = (first, second) =>
  first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();

export default function CalendarPage() {
  const { showToast } = useToast();
  const { tasks, loading, syncing, updateTask, deleteTask } = useWorkspace();
  const [view, setView] = useState("month");
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [taskActionId, setTaskActionId] = useState("");

  const datedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.dueDate)
        .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate)),
    [tasks]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map();

    datedTasks.forEach((task) => {
      const key = formatDateKey(task.dueDate);
      const current = map.get(key) || [];
      current.push(task);
      map.set(key, current);
    });

    return map;
  }, [datedTasks]);

  const monthDays = useMemo(() => buildMonthGrid(visibleDate), [visibleDate]);
  const weekDays = useMemo(() => buildWeekDays(visibleDate), [visibleDate]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task._id === selectedTaskId) || null,
    [selectedTaskId, tasks]
  );

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return datedTasks
      .filter((task) => new Date(task.dueDate) >= today)
      .slice(0, 5);
  }, [datedTasks]);

  const navigatePeriod = (direction) => {
    setVisibleDate((current) => {
      const next = new Date(current);

      if (view === "month") {
        next.setMonth(current.getMonth() + direction);
      } else {
        next.setDate(current.getDate() + direction * 7);
      }

      return next;
    });
  };

  const handleUpdateTask = async (values) => {
    if (!selectedTask) {
      return;
    }

    setTaskActionId(selectedTask._id);

    try {
      const updatedTask = await updateTask(selectedTask._id, values);
      setSelectedTaskId(updatedTask._id);
      showToast({
        title: "Task updated",
        description: `${updatedTask.title} is now ${taskStatusLabels[updatedTask.status].toLowerCase()}.`,
        type: "success",
      });
    } catch (requestError) {
      showToast({
        title: "Unable to update task",
        description: requestError.response?.data?.message || "Please try again.",
        type: "error",
      });
    } finally {
      setTaskActionId("");
    }
  };

  const handleDeleteTask = async (task) => {
    setTaskActionId(task._id);

    try {
      await deleteTask(task._id);
      if (selectedTaskId === task._id) {
        setSelectedTaskId("");
      }
      showToast({
        title: "Task deleted",
        description: `${task.title} was removed.`,
        type: "success",
      });
    } catch (requestError) {
      showToast({
        title: "Unable to delete task",
        description: requestError.response?.data?.message || "Please try again.",
        type: "error",
      });
    } finally {
      setTaskActionId("");
    }
  };

  const renderTaskChip = (task, compact = false) => (
    <button
      key={task._id}
      className={`w-full rounded-xl border px-2.5 py-2 text-left transition hover:border-white/15 hover:bg-white/[0.07] ${
        compact ? "min-h-[56px]" : ""
      } ${statusTone[task.status] || statusTone.todo}`}
      onClick={() => setSelectedTaskId(task._id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs font-semibold">{task.title}</p>
        <span className={priorityStyles[task.priority] || priorityStyles.medium}>
          {task.priority || "medium"}
        </span>
      </div>
      <p className="mt-1 truncate text-[11px] opacity-80">
        {task.assignedTo?.name || task.projectId?.name || "Scheduled task"}
      </p>
    </button>
  );

  const renderMonthView = () => (
    <section className="app-panel-primary overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/8 bg-slate-950/35">
        {monthWeekDays.map((day) => (
          <div key={day} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthDays.map((day) => {
          const key = formatDateKey(day);
          const dayTasks = tasksByDate.get(key) || [];
          const today = isSameDay(day, new Date());

          return (
            <div
              key={key}
              className={`min-h-[148px] border-b border-r border-white/8 p-3 align-top ${
                isSameMonth(day, visibleDate) ? "bg-transparent" : "bg-slate-950/25"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    today
                      ? "bg-brand-500/20 text-brand-100"
                      : isSameMonth(day, visibleDate)
                        ? "text-text-primary"
                        : "text-text-subtle"
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayTasks.length ? (
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-text-subtle">
                    {dayTasks.length}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                {dayTasks.slice(0, 3).map((task) => renderTaskChip(task, true))}
                {dayTasks.length > 3 ? (
                  <div className="rounded-lg border border-dashed border-white/10 px-2 py-1.5 text-[11px] text-text-subtle">
                    +{dayTasks.length - 3} more tasks
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderWeekView = () => (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="app-panel-primary overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/8 bg-slate-950/35">
          {weekDays.map((day) => {
            const today = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className="px-3 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-subtle">
                  {monthWeekDays[day.getDay()]}
                </p>
                <p className={`mt-2 text-lg font-semibold ${today ? "text-brand-200" : "text-text-primary"}`}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7">
          {weekDays.map((day) => {
            const key = formatDateKey(day);
            const dayTasks = tasksByDate.get(key) || [];

            return (
              <div key={key} className="min-h-[520px] border-r border-white/8 p-3">
                <div className="space-y-2">
                  {dayTasks.length ? (
                    dayTasks.map((task) => renderTaskChip(task))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/35 px-3 py-5 text-center text-xs text-text-subtle">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="app-panel-secondary p-5">
        <SectionHeader label="Agenda" title="Upcoming due dates" />
        {upcomingTasks.length ? (
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <button
                key={task._id}
                className="app-row-hover w-full px-4 py-3 text-left"
                onClick={() => setSelectedTaskId(task._id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{task.title}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {task.projectId?.name || "Project task"}
                    </p>
                  </div>
                  <span className="text-xs text-text-subtle">
                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Tasks with due dates will appear here so upcoming work is easy to spot."
            title="No upcoming tasks"
          />
        )}
      </aside>
    </section>
  );

  return (
    <WorkspaceLayout
      label="Calendar"
      primaryActionDisabled
      primaryActionLabel="Scheduled"
      showSearch={false}
      title="Calendar"
    >
      <section className="app-panel-primary p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="app-kicker">Schedule</p>
            <h2 className="mt-1 text-2xl font-semibold text-text-primary">
              {view === "month"
                ? formatMonthLabel(visibleDate)
                : formatWeekRange(weekDays[0], weekDays[6])}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Tasks with due dates are mapped here automatically from your real projects.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-2xl border border-white/8 bg-slate-950/65 p-1">
              {viewTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      view === tab.id
                        ? "bg-white/[0.08] text-text-primary"
                        : "text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
                    }`}
                    onClick={() => setView(tab.id)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-slate-950/65 p-1">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
                onClick={() => navigatePeriod(-1)}
                type="button"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-text-primary transition hover:bg-white/[0.05]"
                onClick={() => setVisibleDate(new Date())}
                type="button"
              >
                <CalendarDays className="h-4 w-4" />
                Today
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
                onClick={() => navigatePeriod(1)}
                type="button"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {loading || syncing ? (
        <section className="app-panel-primary px-4 py-12 text-center text-sm text-text-muted">
          Loading calendar...
        </section>
      ) : !datedTasks.length ? (
        <EmptyState
          description="Add due dates to tasks and they’ll appear automatically in monthly and weekly views."
          title="No scheduled tasks yet"
        />
      ) : view === "month" ? (
        renderMonthView()
      ) : (
        renderWeekView()
      )}

      <TaskDetailsDrawer
        deleting={Boolean(selectedTask && taskActionId === selectedTask._id)}
        members={selectedTask?.projectId?.members || []}
        onClose={() => setSelectedTaskId("")}
        onDelete={handleDeleteTask}
        onSave={handleUpdateTask}
        open={Boolean(selectedTask)}
        saving={Boolean(selectedTask && taskActionId === selectedTask._id)}
        task={selectedTask}
      />
    </WorkspaceLayout>
  );
}
