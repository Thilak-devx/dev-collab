import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";
import { SkeletonList } from "../components/dashboard/LoadingSkeleton";
import SectionHeader from "../components/dashboard/SectionHeader";
import TaskList from "../components/dashboard/TaskList";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";

const tabs = [
  { id: "all", label: "All" },
  { id: "todo", label: "Todo" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

export default function TasksPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { tasks, loading, syncing, createProject, updateTask, deleteTask } = useWorkspace();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createProjectError, setCreateProjectError] = useState("");

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = activeTab === "all" || task.status === activeTab;
      const matchesQuery =
        !query
        || [task.title, task.description, task.projectId?.name, task.assignedTo?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [activeTab, search, tasks]);

  const handleCreateProject = async (values) => {
    setCreateProjectLoading(true);
    setCreateProjectError("");

    try {
      const project = await createProject(values);
      setShowCreateProjectModal(false);
      showToast({
        title: "Project created",
        description: `${project.name} is ready for tasks.`,
        type: "success",
      });
      navigate(`/projects/${project._id}`);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to create project";
      setCreateProjectError(message);
      showToast({
        title: "Project creation failed",
        description: message,
        type: "error",
      });
    } finally {
      setCreateProjectLoading(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    if (task.status === status) {
      return;
    }

    setActionLoadingId(task._id);

    try {
      await updateTask(task._id, { status });
      showToast({
        title: "Task updated",
        description: `${task.title} moved to ${status}.`,
        type: "success",
      });
    } catch (requestError) {
      showToast({
        title: "Unable to update task",
        description: requestError.response?.data?.message || "Please try again.",
        type: "error",
      });
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeleteTask = async (task) => {
    setActionLoadingId(task._id);

    try {
      await deleteTask(task._id);
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
      setActionLoadingId("");
    }
  };

  return (
    <WorkspaceLayout
      label="Tasks"
      onPrimaryAction={() => setShowCreateProjectModal(true)}
      onSearchChange={(event) => setSearch(event.target.value)}
      search={search}
      searchPlaceholder="Search tasks"
      title="Tasks"
    >
      <section className="app-panel-primary p-5">
        <SectionHeader label="Queue" title="All visible tasks" />

        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-brand-500/20 text-brand-200"
                  : "border border-white/8 bg-slate-950/75 text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
              }`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading || syncing ? (
          <SkeletonList rows={5} />
        ) : (
          <TaskList
            actionLoadingId={actionLoadingId}
            emptyDescription="No tasks yet — create one from a project workspace and it will appear here automatically."
            emptyTitle="No tasks yet — create one"
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            tasks={visibleTasks}
          />
        )}
      </section>

      <CreateProjectModal
        error={createProjectError}
        loading={createProjectLoading}
        onClose={() => setShowCreateProjectModal(false)}
        onSubmit={handleCreateProject}
        open={showCreateProjectModal}
      />
    </WorkspaceLayout>
  );
}
