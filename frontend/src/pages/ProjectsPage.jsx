import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpenDot, Trash2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";
import ConfirmModal from "../components/dashboard/ConfirmModal";
import EmptyState from "../components/dashboard/EmptyState";
import { SkeletonList } from "../components/dashboard/LoadingSkeleton";
import SectionHeader from "../components/dashboard/SectionHeader";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { projects, loading, syncing, error, createProject, deleteProject } = useWorkspace();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) =>
      [project.name, project.description, project.owner?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [projects, search]);

  const handleCreateProject = async (values) => {
    setCreateLoading(true);
    setCreateError("");

    try {
      const project = await createProject(values);
      setShowCreateModal(false);
      showToast({
        title: "Project created",
        description: `${project.name} was added to your workspace.`,
        type: "success",
      });
      navigate(`/projects/${project._id}`);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to create project";
      setCreateError(message);
      showToast({
        title: "Project creation failed",
        description: message,
        type: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) {
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteProject(projectToDelete._id);
      showToast({
        title: "Project deleted",
        description: `${projectToDelete.name} was removed from your workspace.`,
        type: "success",
      });
      setProjectToDelete(null);
    } catch (requestError) {
      showToast({
        title: "Unable to delete project",
        description: requestError.response?.data?.message || "Please try again.",
        type: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <WorkspaceLayout
      label="Projects"
      onPrimaryAction={() => setShowCreateModal(true)}
      onSearchChange={(event) => setSearch(event.target.value)}
      search={search}
      searchPlaceholder="Search projects"
      title="Projects"
    >
      <section className="app-panel-primary p-5">
        <SectionHeader label="Directory" title="All workspace projects" />

        {loading || syncing ? (
          <SkeletonList rows={4} />
        ) : filteredProjects.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredProjects.map((project) => {
              const isOwner = project.owner?._id === user?.id || project.owner?.id === user?.id;

              return (
                <article
                  key={project._id}
                  className="app-row-hover p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      className="min-w-0 text-left"
                      onClick={() => navigate(`/projects/${project._id}`)}
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpenDot className="h-4.5 w-4.5 text-brand-300" />
                        <h2 className="text-base font-semibold text-text-primary">{project.name}</h2>
                      </div>
                      <p className="mt-2 app-muted-copy">
                        {project.description || "No description added yet."}
                      </p>
                    </button>

                    {isOwner ? (
                      <button
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 text-text-muted transition hover:bg-red-500/10 hover:text-red-200"
                        onClick={() => setProjectToDelete(project)}
                        type="button"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-subtle">
                    <span>{project.members?.length || 1} members</span>
                    <span>Owner: {project.owner?.name || "Unknown"}</span>
                    <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            action={
              <button
                className="app-primary-button"
                onClick={() => setShowCreateModal(true)}
                type="button"
              >
                Create your first project
              </button>
            }
            description="Your workspace is empty. Start by creating a project and inviting collaborators."
            title="No projects yet"
          />
        )}
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </section>
      ) : null}

      <CreateProjectModal
        error={createError}
        loading={createLoading}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        open={showCreateModal}
      />

      <ConfirmModal
        confirmLabel="Delete project"
        description={
          projectToDelete
            ? `Delete ${projectToDelete.name} and all of its tasks. This cannot be undone.`
            : ""
        }
        loading={deleteLoading}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
        open={Boolean(projectToDelete)}
        title="Delete project"
      />
    </WorkspaceLayout>
  );
}
