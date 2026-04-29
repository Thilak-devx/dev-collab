import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CheckCircle2, FolderKanban, Users } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";
import OverviewPanel from "../components/dashboard/OverviewPanel";
import ProjectsPanel from "../components/dashboard/ProjectsPanel";
import RecentActivityPanel from "../components/dashboard/RecentActivityPanel";
import StatCard from "../components/dashboard/StatCard";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { projects, tasks, activities, loading, syncing, error, createProject } = useWorkspace();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const haystack = [project.name, project.description, project.owner?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [projects, search]);

  const uniqueMembers = new Set(
    projects.flatMap((project) => (project.members || []).map((member) => member.email || member._id))
  ).size;
  const ownedProjects = projects.filter(
    (project) => project.owner?.id === user?.id || project.owner?._id === user?.id
  ).length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;

  const stats = [
    {
      label: "Projects",
      value: projects.length,
      hint: "All active workspaces",
      icon: FolderKanban,
      accent: "text-brand-300",
    },
    {
      label: "Tasks",
      value: tasks.length,
      hint: "Across your visible projects",
      icon: BriefcaseBusiness,
      accent: "text-sky-300",
    },
    {
      label: "Completed",
      value: completedTasks,
      hint: "Finished tasks",
      icon: CheckCircle2,
      accent: "text-emerald-300",
    },
    {
      label: "Members",
      value: uniqueMembers,
      hint: "Across visible projects",
      icon: Users,
      accent: "text-violet-300",
    },
  ];

  const handleCreateProject = async (values) => {
    setCreateLoading(true);
    setCreateError("");

    try {
      const project = await createProject(values);
      setShowCreateModal(false);
      showToast({
        title: "Project created",
        description: `${project.name} is ready for your team.`,
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

  return (
    <WorkspaceLayout
      label="Overview"
      onPrimaryAction={() => setShowCreateModal(true)}
      onSearchChange={(event) => setSearch(event.target.value)}
      search={search}
      searchPlaceholder="Search projects"
      title="Dashboard"
    >
      <section className="app-panel-primary app-subtle-grid px-5 py-5">
        <p className="app-kicker">
          Workspace snapshot
        </p>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary lg:text-[2rem]">
              {user?.name || "Team member"}, here&apos;s what matters today.
            </h2>
            <p className="mt-2 app-muted-copy">
              Projects, ownership, and collaboration in one place without the extra filler.
            </p>
          </div>
          <p className="text-sm text-text-subtle">
            {loading || syncing ? "Syncing workspace..." : `${filteredProjects.length} projects in view`}
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.9fr)]">
        <ProjectsPanel
          onProjectOpen={(project) => navigate(`/projects/${project._id}`)}
          onViewAll={() => navigate("/projects")}
          projects={filteredProjects}
        />
        <OverviewPanel projects={projects} tasks={tasks} user={user} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,1fr)]">
        <div className="app-panel-secondary p-5">
          <p className="app-kicker">
            Team scope
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="app-row px-4 py-4">
              <p className="text-sm text-text-muted">Owned by you</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">{ownedProjects}</p>
            </div>
            <div className="app-row px-4 py-4">
              <p className="text-sm text-text-muted">Collaborative projects</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {Math.max(projects.length - ownedProjects, 0)}
              </p>
            </div>
          </div>
        </div>

        <RecentActivityPanel activities={activities.slice(0, 6)} />
      </section>

      <CreateProjectModal
        error={createError}
        loading={createLoading}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        open={showCreateModal}
      />
    </WorkspaceLayout>
  );
}
