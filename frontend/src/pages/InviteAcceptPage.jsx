import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Link2, LoaderCircle, ShieldCheck } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import { getInviteDetails } from "../services/inviteService";

const buildRedirect = (token) => encodeURIComponent(`/invite/${token}`);

export default function InviteAcceptPage() {
  const navigate = useNavigate();
  const { token: inviteToken } = useParams();
  const { token, loading: authLoading } = useAuth();
  const { acceptProjectInvite } = useWorkspace();
  const { showToast } = useToast();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [project, setProject] = useState(null);
  const [invite, setInvite] = useState(null);

  const redirectTarget = useMemo(() => buildRedirect(inviteToken), [inviteToken]);

  useEffect(() => {
    if (!inviteToken || status !== "idle") {
      return;
    }

    const loadInvite = async () => {
      setStatus("loading");
      setMessage("");

      try {
        const result = await getInviteDetails(inviteToken);
        setInvite(result.invite || null);
        setProject(result.project || null);
        setStatus("ready");
      } catch (requestError) {
        setStatus("error");
        setMessage(requestError.response?.data?.message || "Unable to accept invite");
      }
    };

    loadInvite();
  }, [inviteToken, status]);

  const handleJoinProject = async () => {
    if (!inviteToken) {
      return;
    }

    setStatus("joining");
    setMessage("");

    try {
      const result = await acceptProjectInvite(inviteToken);
      setProject(result.project || null);
      setInvite((current) =>
        current
          ? {
            ...current,
            usedCount: result.invite?.usedCount ?? current.usedCount,
            remainingUses: result.invite?.remainingUses ?? current.remainingUses,
          }
          : current
      );
      setStatus("success");
      setMessage(result.message || "Project joined successfully");
      showToast({
        title: "Invite accepted",
        description: result.message || "You now have access to the project.",
        type: "success",
      });
    } catch (requestError) {
      setStatus("error");
      setMessage(requestError.response?.data?.message || "Unable to join project");
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617_0%,#081226_48%,#000814_100%)] px-6 text-white">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
          Checking your session...
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617_0%,#081226_48%,#000814_100%)] px-6 py-10 text-white">
        <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-violet-300">
            <Link2 className="h-6 w-6" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold text-white">
            {project?.name || "Project invite"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            {status === "loading"
              ? "Loading invite details..."
              : project?.description
                ? project.description
                : "Sign in or create an account to join this DevCollab project with your invite link."}
          </p>

          {status === "error" ? (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {message}
            </div>
          ) : null}

          {project ? (
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
              {typeof project.memberCount === "number" ? <span>{project.memberCount} members</span> : null}
              {invite?.remainingUses !== null && invite?.remainingUses !== undefined ? (
                <span>{invite.remainingUses} uses left</span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-5 text-sm font-medium text-white transition hover:brightness-110"
              to={`/login?redirect=${redirectTarget}`}
            >
              Sign in
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-text-primary transition hover:bg-white/[0.05]"
              to={`/register?redirect=${redirectTarget}`}
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617_0%,#081226_48%,#000814_100%)] px-6 py-10 text-white">
      <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-violet-300">
          {status === "loading" || status === "joining" ? (
            <LoaderCircle className="h-6 w-6 animate-spin" />
          ) : (
            <ShieldCheck className="h-6 w-6" />
          )}
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-white">
          {status === "loading" ? "Loading invite..." : status === "joining" ? "Joining project..." : "Project invite"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          {status === "loading"
            ? "We are checking the invite details."
            : status === "joining"
              ? "We are adding you to the project now."
              : message || "You can join this project from here."}
        </p>

        {status === "error" ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {message}
          </div>
        ) : null}

        {status === "ready" && project ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Project
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{project.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              {project.description || "Join this workspace and start collaborating with the team."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
              {typeof project.memberCount === "number" ? <span>{project.memberCount} members</span> : null}
              {invite?.remainingUses !== null && invite?.remainingUses !== undefined ? (
                <span>{invite.remainingUses} uses left</span>
              ) : (
                <span>Unlimited uses</span>
              )}
            </div>
          </div>
        ) : null}

        {status === "ready" && token ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-5 text-sm font-medium text-white transition hover:brightness-110"
              onClick={handleJoinProject}
              type="button"
            >
              Join project
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-text-primary transition hover:bg-white/[0.05]"
              onClick={() => navigate("/dashboard")}
              type="button"
            >
              Back to dashboard
            </button>
          </div>
        ) : null}

        {status === "success" && project ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-5 text-sm font-medium text-white transition hover:brightness-110"
              onClick={() => navigate(`/projects/${project._id}`)}
              type="button"
            >
              Open project
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-text-primary transition hover:bg-white/[0.05]"
              onClick={() => navigate("/dashboard")}
              type="button"
            >
              Go to dashboard
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
