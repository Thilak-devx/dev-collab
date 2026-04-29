import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import ConfirmModal from "../components/dashboard/ConfirmModal";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, deleteAccount, updateProfile } = useAuth();
  const { createProject } = useWorkspace();
  const { showToast } = useToast();
  const [profileValues, setProfileValues] = useState({ name: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createProjectError, setCreateProjectError] = useState("");

  useEffect(() => {
    setProfileValues({
      name: user?.name || "",
      email: user?.email || "",
    });
  }, [user]);

  const handleCreateProject = async (values) => {
    setCreateProjectLoading(true);
    setCreateProjectError("");

    try {
      const project = await createProject(values);
      setShowCreateProjectModal(false);
      showToast({
        title: "Project created",
        description: `${project.name} is ready to use.`,
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

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileLoading(true);
    setProfileError("");

    try {
      await updateProfile(profileValues);
      showToast({
        title: "Profile updated",
        description: "Your account details were saved successfully.",
        type: "success",
      });
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to update profile";
      setProfileError(message);
      showToast({
        title: "Profile update failed",
        description: message,
        type: "error",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast({
      title: "Signed out",
      description: "You have been logged out successfully.",
      type: "success",
    });
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      await deleteAccount();
      showToast({
        title: "Account deleted",
        description: "Your account and related workspace data were removed.",
        type: "success",
      });
      navigate("/login");
    } catch (requestError) {
      showToast({
        title: "Unable to delete account",
        description: requestError.response?.data?.message || "Please try again.",
        type: "error",
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <WorkspaceLayout
      label="Settings"
      onPrimaryAction={() => setShowCreateProjectModal(true)}
      showSearch={false}
      title="Settings"
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="app-panel-primary p-5">
          <p className="app-kicker">
            Account
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">Profile settings</h2>
          <p className="mt-2 app-muted-copy">
            Update your live account information stored in DevCollab.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-text-muted">Name</span>
              <input
                className="premium-auth-input h-11 pl-3.5"
                name="name"
                onChange={(event) =>
                  setProfileValues((current) => ({ ...current, name: event.target.value }))
                }
                value={profileValues.name}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-text-muted">Email</span>
              <input
                className="premium-auth-input h-11 pl-3.5"
                name="email"
                onChange={(event) =>
                  setProfileValues((current) => ({ ...current, email: event.target.value }))
                }
                type="email"
                value={profileValues.email}
              />
            </label>

            {profileError ? <p className="text-sm text-red-300">{profileError}</p> : null}

            <button
              className="app-primary-button disabled:opacity-70"
              disabled={profileLoading}
              type="submit"
            >
              {profileLoading ? "Saving..." : "Save profile"}
            </button>
          </form>
        </article>

        <article className="app-panel-secondary p-5">
          <p className="app-kicker">
            Actions
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">Session controls</h2>
          <p className="mt-2 app-muted-copy">
            Sign out safely or permanently remove your account from DevCollab.
          </p>

          <div className="mt-6 space-y-3">
            <button
              className="w-full app-action-button"
              onClick={handleLogout}
              type="button"
            >
              Sign out
            </button>
            <button
              className="w-full rounded-xl border border-red-400/20 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
              onClick={() => setShowDeleteModal(true)}
              type="button"
            >
              Delete account
            </button>
          </div>
        </article>
      </section>

      <CreateProjectModal
        error={createProjectError}
        loading={createProjectLoading}
        onClose={() => setShowCreateProjectModal(false)}
        onSubmit={handleCreateProject}
        open={showCreateProjectModal}
      />

      <ConfirmModal
        confirmLabel="Delete account"
        description="This removes your account, deletes your owned projects, and removes related tasks. This cannot be undone."
        loading={deleteLoading}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        open={showDeleteModal}
        title="Delete account"
      />
    </WorkspaceLayout>
  );
}
