import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Shield, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import InviteModal from "../components/InviteModal";
import ConfirmModal from "../components/dashboard/ConfirmModal";
import CreateTaskModal from "../components/dashboard/CreateTaskModal";
import EmptyState from "../components/dashboard/EmptyState";
import { SkeletonCardGrid, SkeletonLines, SkeletonList } from "../components/dashboard/LoadingSkeleton";
import ProjectChat from "../components/dashboard/ProjectChat";
import ProjectTaskBoard from "../components/dashboard/ProjectTaskBoard";
import RecentActivityPanel from "../components/dashboard/RecentActivityPanel";
import SectionHeader from "../components/dashboard/SectionHeader";
import TaskDetailsDrawer from "../components/dashboard/TaskDetailsDrawer";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";
import useAuth from "../hooks/useAuth";
import useProjectRoom from "../hooks/useProjectRoom";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import { getActivities } from "../services/activityService";

const taskStatusLabels = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  useProjectRoom(projectId);
  const {
    projects,
    tasks,
    activities,
    createTask,
    updateTask,
    deleteTask,
    deleteProject,
    inviteProjectMember,
    generateProjectInvite,
    loadProjectDetails,
  } = useWorkspace();

  const [project, setProject] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [projectActivities, setProjectActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [taskActionId, setTaskActionId] = useState("");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [deleteProjectLoading, setDeleteProjectLoading] = useState(false);
  const [createTaskError, setCreateTaskError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState(null);
  const [inviteUsedCount, setInviteUsedCount] = useState(0);

  useEffect(() => {
    const existingProject = projects.find((entry) => entry._id === projectId);

    if (existingProject) {
      setProject(existingProject);
    }
  }, [projectId, projects]);

  useEffect(() => {
    const syncProject = async () => {
      setPageLoading(true);
      setPageError("");

      try {
        const details = await loadProjectDetails(projectId);
        setProject(details.project);
      } catch (requestError) {
        setPageError(requestError.response?.data?.message || "Unable to load project");
      } finally {
        setPageLoading(false);
      }
    };

    syncProject();
  }, [loadProjectDetails, projectId]);

  useEffect(() => {
    const loadProjectActivity = async () => {
      setActivityLoading(true);

      try {
        const data = await getActivities({ projectId, limit: 20 });
        setProjectActivities(data);
      } catch {
        setProjectActivities([]);
      } finally {
        setActivityLoading(false);
      }
    };

    loadProjectActivity();
  }, [projectId]);

  useEffect(() => {
    const liveProjectActivities = activities.filter(
      (activity) => activity.projectId?._id === projectId || activity.projectId?.id === projectId
    );

    if (!liveProjectActivities.length) {
      return;
    }

    setProjectActivities((current) => {
      const merged = [...liveProjectActivities, ...current];
      const unique = merged.filter(
        (activity, index, list) => list.findIndex((entry) => entry._id === activity._id) === index
      );

      return unique
        .sort((first, second) => new Date(second.timestamp || second.createdAt) - new Date(first.timestamp || first.createdAt))
        .slice(0, 20);
    });
  }, [activities, projectId]);

  const projectTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.projectId?._id === projectId || task.projectId === projectId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [projectId, tasks]
  );

  const selectedTask = useMemo(
    () => projectTasks.find((task) => task._id === selectedTaskId) || null,
    [projectTasks, selectedTaskId]
  );

  const isOwner = project?.owner?._id === user?.id || project?.owner?.id === user?.id;
  const doneCount = projectTasks.filter((task) => task.status === "done").length;
  const inProgressCount = projectTasks.filter((task) => task.status === "in_progress").length;

  const handleCreateTask = async (values) => {
    setCreateTaskLoading(true);
    setCreateTaskError("");

    try {
      const task = await createTask({ ...values, projectId });
      setShowCreateTaskModal(false);
      setSelectedTaskId(task._id);
      showToast({
        title: "Task created",
        description: `${task.title} was added to ${project?.name || "the project"}.`,
        type: "success",
      });
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to create task";
      setCreateTaskError(message);
      showToast({
        title: "Task creation failed",
        description: message,
        type: "error",
      });
    } finally {
      setCreateTaskLoading(false);
    }
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

  const handleDeleteTask = async (taskToDelete) => {
    setTaskActionId(taskToDelete._id);

    try {
      await deleteTask(taskToDelete._id);
      if (selectedTaskId === taskToDelete._id) {
        setSelectedTaskId("");
      }
      showToast({
        title: "Task deleted",
        description: `${taskToDelete.title} was removed.`,
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

  const handleInviteMember = async (email) => {
    setInviteLoading(true);
    setInviteError("");

    try {
      const updatedProject = await inviteProjectMember(projectId, email);
      setProject(updatedProject);
      showToast({
        title: "Member invited",
        description: `${email} was added to ${updatedProject.name}.`,
        type: "success",
      });
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to invite member";
      setInviteError(message);
      showToast({
        title: "Invite failed",
        description: message,
        type: "error",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleGenerateInviteLink = async (regenerate = false) => {
    setInviteLinkLoading(true);
    setInviteError("");

    try {
      const result = await generateProjectInvite(projectId, { regenerate });
      setInviteLink(result.invite.inviteUrl);
      setInviteExpiresAt(result.invite.expiresAt);
      setInviteMaxUses(result.invite.maxUses);
      setInviteUsedCount(result.invite.usedCount || 0);
      showToast({
        title: regenerate ? "Invite link regenerated" : "Invite link ready",
        description: "Share this link before it expires in 24 hours.",
        type: "success",
      });
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to generate invite link";
      setInviteError(message);
      showToast({
        title: "Invite link failed",
        description: message,
        type: "error",
      });
    } finally {
      setInviteLinkLoading(false);
    }
  };

  const handleCopyInviteLink = async (link, sourceLabel) => {
    try {
      await navigator.clipboard.writeText(link);
      showToast({
        title: "Invite link copied",
        description:
          sourceLabel === "copy"
            ? "The project invite link is ready to paste."
            : `The project invite link was copied for ${sourceLabel}.`,
        type: "success",
      });
    } catch {
      showToast({
        title: "Copy failed",
        description: "Clipboard access was blocked. Try copying the link manually.",
        type: "error",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!project) {
      return;
    }

    setDeleteProjectLoading(true);

    try {
      await deleteProject(project._id);
      showToast({
        title: "Project deleted",
        description: `${project.name} and its tasks were removed.`,
        type: "success",
      });
      navigate("/projects");
    } catch (requestError) {
      showToast({
        title: "Unable to delete project",
        description: requestError.response?.data?.message || "Please try again.",
        type: "error",
      });
    } finally {
      setDeleteProjectLoading(false);
    }
  };

  const renderTasksTab = () => (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="app-panel-secondary p-4">
          <p className="app-kicker">Total tasks</p>
          <p className="mt-3 text-3xl font-semibold text-text-primary">{projectTasks.length}</p>
          <p className="mt-2 text-sm text-text-muted">Active work items in this workspace.</p>
        </article>
        <article className="app-panel-secondary p-4">
          <p className="app-kicker">In progress</p>
          <p className="mt-3 text-3xl font-semibold text-text-primary">{inProgressCount}</p>
          <p className="mt-2 text-sm text-text-muted">Tasks currently moving through execution.</p>
        </article>
        <article className="app-panel-secondary p-4">
          <p className="app-kicker">Completed</p>
          <p className="mt-3 text-3xl font-semibold text-text-primary">{doneCount}</p>
          <p className="mt-2 text-sm text-text-muted">Finished deliverables ready for review.</p>
        </article>
      </div>

      <ProjectTaskBoard
        onCreateTask={() => setShowCreateTaskModal(true)}
        onTaskClick={(task) => setSelectedTaskId(task._id)}
        tasks={projectTasks}
      />
    </section>
  );

  const renderActivityTab = () => (
    activityLoading ? (
      <div className="app-panel-secondary p-5">
        <SkeletonList rows={4} />
      </div>
    ) : (
      <RecentActivityPanel activities={projectActivities} />
    )
  );

  const renderChatPanel = () => (
    <ProjectChat
      projectId={projectId}
      projectName={project?.name}
    />
  );

  return (
    <WorkspaceLayout
      label="Project workspace"
      onPrimaryAction={() => setShowCreateTaskModal(true)}
      primaryActionLabel="New Task"
      showSearch={false}
      title={project?.name || "Project workspace"}
    >
      {pageError ? (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {pageError}
        </section>
      ) : null}

      {pageLoading ? (
        <div className="space-y-4">
          <section className="app-panel-primary p-6">
            <SkeletonLines lines={3} />
          </section>
          <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
            <SkeletonCardGrid cards={3} />
            <div className="app-panel-primary p-6">
              <SkeletonList rows={5} />
            </div>
          </section>
        </div>
      ) : !project ? (
        <EmptyState
          description="This project could not be found, or you no longer have access to it."
          title="Project unavailable"
        />
      ) : (
        <div className="space-y-4">
          <section className="app-panel-primary p-5">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="app-kicker">Workspace</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
                  {project.name}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-text-muted">
                  {project.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex -space-x-2">
                    {(project.members || []).slice(0, 5).map((member) => (
                      <span
                        key={member._id}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-950 bg-slate-800 text-xs font-semibold text-text-primary"
                        title={member.name}
                      >
                        {member.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-medium text-text-subtle">
                    {project.members?.length || 0} collaborators
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-medium text-text-subtle">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isOwner ? (
                  <button
                    className="h-11 rounded-xl border border-white/8 px-4 text-sm font-medium text-text-primary transition hover:bg-white/[0.05]"
                    onClick={() => setShowInviteModal(true)}
                    type="button"
                  >
                    Invite member
                  </button>
                ) : null}
                <button
                  className="app-primary-button inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white"
                  onClick={() => setShowCreateTaskModal(true)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  New task
                </button>
                {isOwner ? (
                  <button
                    className="h-11 rounded-xl border border-red-400/20 px-4 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
                    onClick={() => setShowDeleteModal(true)}
                    type="button"
                  >
                    Delete project
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
            <div className="min-w-0 space-y-4">
              {renderTasksTab()}
            </div>

            <div className="min-w-0">
              {renderChatPanel()}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="min-w-0">
              {renderActivityTab()}
            </div>

            <aside className="app-panel-primary p-5">
              <SectionHeader label="Members" title="Workspace members" />

              <div className="mt-5 flex flex-wrap gap-3">
                {(project.members || []).map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/65 px-3 py-3"
                  >
                    <span className="app-avatar h-11 w-11">
                      {member.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{member.name}</p>
                      <p className="truncate text-xs text-text-muted">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4 rounded-2xl border border-white/8 bg-slate-950/45 p-4 text-sm text-text-muted">
                <div className="flex items-center gap-3">
                  <Users className="h-4.5 w-4.5 text-brand-300" />
                  <span>{project.members?.length || 0} total members</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4.5 w-4.5 text-sky-300" />
                  <span>{project.owner?.name || "Unknown"} manages this workspace</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4.5 w-4.5 text-emerald-300" />
                  <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {isOwner ? (
                <button
                  className="app-primary-button mt-6 h-11 w-full rounded-xl px-4 text-sm font-medium text-white"
                  onClick={() => setShowInviteModal(true)}
                  type="button"
                >
                  Invite member
                </button>
              ) : null}
            </aside>
          </section>
        </div>
      )}

      <CreateTaskModal
        error={createTaskError}
        loading={createTaskLoading}
        members={project?.members || []}
        onClose={() => setShowCreateTaskModal(false)}
        onSubmit={handleCreateTask}
        open={showCreateTaskModal}
      />

      <InviteModal
        error={inviteError}
        expiresAt={inviteExpiresAt}
        inviteLink={inviteLink}
        linkLoading={inviteLinkLoading}
        loading={inviteLoading}
        maxUses={inviteMaxUses}
        onClose={() => setShowInviteModal(false)}
        onCopyLink={handleCopyInviteLink}
        onGenerateLink={() => handleGenerateInviteLink(false)}
        onRegenerateLink={() => handleGenerateInviteLink(true)}
        onSubmit={handleInviteMember}
        open={showInviteModal}
        usedCount={inviteUsedCount}
      />

      <ConfirmModal
        confirmLabel="Delete project"
        description={
          project
            ? `Delete ${project.name} and all of its tasks. This action cannot be undone.`
            : ""
        }
        loading={deleteProjectLoading}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProject}
        open={showDeleteModal}
        title="Delete project"
      />

      <TaskDetailsDrawer
        deleting={Boolean(selectedTask && taskActionId === selectedTask._id)}
        members={project?.members || []}
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
