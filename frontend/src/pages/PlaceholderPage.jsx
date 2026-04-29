import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";
import EmptyState from "../components/dashboard/EmptyState";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";

export default function PlaceholderPage({ label, title, description }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { createProject } = useWorkspace();
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createProjectError, setCreateProjectError] = useState("");

  const handleCreateProject = async (values) => {
    setCreateProjectLoading(true);
    setCreateProjectError("");

    try {
      const project = await createProject(values);
      setShowCreateProjectModal(false);
      showToast({
        title: "Project created",
        description: `${project.name} is available from the projects page.`,
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

  return (
    <WorkspaceLayout
      label={label}
      onNotificationsClick={() =>
        showToast({
          title: "Notifications",
          description: `${title} updates are not enabled yet.`,
        })
      }
      onPrimaryAction={() => setShowCreateProjectModal(true)}
      showSearch={false}
      title={title}
    >
      <section className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
        <EmptyState
          action={
            <button
              className="rounded-xl border border-white/8 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-white/[0.05]"
              onClick={() => navigate("/projects")}
              type="button"
            >
              Go to projects
            </button>
          }
          description={description}
          title={`${title} is coming next`}
        />
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
