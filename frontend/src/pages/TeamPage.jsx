import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, FolderKanban, Mail, Users } from "lucide-react";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";
import EmptyState from "../components/dashboard/EmptyState";
import SectionHeader from "../components/dashboard/SectionHeader";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";

const buildMemberMap = (projects) => {
  const membersById = new Map();

  projects.forEach((project) => {
    const owner = project.owner
      ? {
        ...project.owner,
        role: "Owner",
      }
      : null;

    const visibleMembers = [
      ...(owner ? [owner] : []),
      ...(project.members || []),
    ];

    visibleMembers.forEach((member) => {
      if (!member?._id) {
        return;
      }

      const current = membersById.get(member._id);

      if (current) {
        current.projects.push({
          _id: project._id,
          name: project.name,
          isOwner: project.owner?._id === member._id || project.owner?.id === member._id,
        });
        return;
      }

      membersById.set(member._id, {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: project.owner?._id === member._id || project.owner?.id === member._id ? "Owner" : "Member",
        projects: [
          {
            _id: project._id,
            name: project.name,
            isOwner: project.owner?._id === member._id || project.owner?.id === member._id,
          },
        ],
      });
    });
  });

  return Array.from(membersById.values()).map((member) => ({
    ...member,
    projects: member.projects.filter(
      (project, index, list) => list.findIndex((entry) => entry._id === project._id) === index
    ),
  }));
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function TeamPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { projects, loading, syncing, error, createProject } = useWorkspace();
  const [search, setSearch] = useState("");
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createProjectError, setCreateProjectError] = useState("");

  const members = useMemo(() => buildMemberMap(projects), [projects]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return members;
    }

    return members.filter((member) =>
      [member.name, member.email, ...member.projects.map((project) => project.name)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [members, search]);

  const ownerCount = useMemo(
    () => members.filter((member) => member.projects.some((project) => project.isOwner)).length,
    [members]
  );

  const handleCreateProject = async (values) => {
    setCreateProjectLoading(true);
    setCreateProjectError("");

    try {
      const project = await createProject(values);
      setShowCreateProjectModal(false);
      showToast({
        title: "Project created",
        description: `${project.name} is ready for collaboration.`,
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
      label="Team"
      onPrimaryAction={() => setShowCreateProjectModal(true)}
      onSearchChange={(event) => setSearch(event.target.value)}
      search={search}
      searchPlaceholder="Search members or projects"
      title="Team"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-200">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-subtle">
                Members
              </p>
              <p className="mt-1 text-2xl font-semibold text-text-primary">{members.length}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-200">
              <FolderKanban className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-subtle">
                Projects
              </p>
              <p className="mt-1 text-2xl font-semibold text-text-primary">{projects.length}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-200">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-subtle">
                Owners
              </p>
              <p className="mt-1 text-2xl font-semibold text-text-primary">{ownerCount}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
        <SectionHeader
          label="Workspace directory"
          title="Real collaborators across your projects"
        />

        {loading || syncing ? (
          <div className="rounded-xl border border-white/8 bg-slate-950/35 px-4 py-10 text-center text-sm text-text-muted">
            Loading team members...
          </div>
        ) : filteredMembers.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredMembers.map((member) => (
              <article
                key={member._id}
                className="rounded-2xl border border-white/8 bg-slate-950/45 p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-sm font-semibold text-text-primary">
                    {getInitials(member.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-text-primary">{member.name}</h2>
                      {member.projects.some((project) => project.isOwner) ? (
                        <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                          Owner
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-text-muted">
                          Member
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-subtle">
                        Active in {member.projects.length} project{member.projects.length === 1 ? "" : "s"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {member.projects.map((project) => (
                          <button
                            key={project._id}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-text-primary transition hover:bg-white/[0.08]"
                            onClick={() => navigate(`/projects/${project._id}`)}
                            type="button"
                          >
                            {project.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            action={(
              <button
                className="rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                onClick={() => setShowCreateProjectModal(true)}
                type="button"
              >
                Create project
              </button>
            )}
            description="Members appear here as soon as you create a project or invite collaborators by email."
            title="No team members yet"
          />
        )}
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </section>
      ) : null}

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
