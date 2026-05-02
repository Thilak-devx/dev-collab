import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const redirectPath = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return query.get("redirect") || "/dashboard";
  }, [location.search]);

  const getRequestErrorMessage = (requestError, fallbackMessage) => {
    if (requestError.response?.data?.message) {
      return requestError.response.data.message;
    }

    if (requestError.request) {
      return "Backend server is unavailable. Make sure the API and MongoDB are running.";
    }

    return fallbackMessage;
  };

  const handleChange = (event) => {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(values);
      navigate(redirectPath);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "Unable to login"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse?.credential;

    if (!token) {
      setError("Google sign-in did not return a valid credential");
      return;
    }

    console.log("Google ID Token:", token);

    setGoogleLoading(true);
    setError("");

    try {
      await loginWithGoogle(token);
      navigate(redirectPath);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "Unable to login with Google"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,_#020617_0%,_#081226_48%,_#000814_100%)] px-6 py-10 text-white">
      <div className="premium-auth-ambient absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_24%),radial-gradient(circle_at_bottom_center,_rgba(14,165,233,0.08),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.16]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),_transparent_58%)]" />
      <div className="premium-auth-blob absolute left-[8%] top-[14%] h-56 w-56 rounded-full bg-violet-500/12 blur-3xl" />
      <div className="premium-auth-blob premium-auth-blob-delayed absolute bottom-[10%] right-[9%] h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="premium-auth-enter relative z-10 w-full max-w-md">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(124,58,237,0.32)_0%,_rgba(59,130,246,0.18)_45%,_transparent_72%)] blur-3xl" />

        <section className="relative rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:p-10">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-[0_12px_30px_rgba(124,58,237,0.25)] backdrop-blur-xl">
              <ShieldCheck className="h-7 w-7 text-violet-300" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
              DevCollab
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-[2.65rem]">
              Welcome back
            </h1>
            <p className="mt-4 text-sm leading-7 text-gray-400 sm:text-base">
              Sign in to keep projects, tasks, and team conversations moving without losing
              momentum.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2.5 block text-sm font-medium text-gray-300">Email</span>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-500 transition group-focus-within:text-violet-300" />
                <input
                  className="premium-auth-input"
                  name="email"
                  onChange={handleChange}
                  placeholder="you@example.com"
                  type="email"
                  value={values.email}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2.5 block text-sm font-medium text-gray-300">Password</span>
              <div className="group relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-500 transition group-focus-within:text-violet-300" />
                <input
                  className="premium-auth-input"
                  name="password"
                  onChange={handleChange}
                  placeholder="Enter your password"
                  type="password"
                  value={values.password}
                  required
                />
              </div>
            </label>

            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 text-sm font-bold text-white shadow-[0_14px_34px_rgba(76,29,149,0.4)] transition-all duration-300 hover:scale-[1.015] hover:brightness-110 hover:shadow-[0_20px_46px_rgba(59,130,246,0.28)] focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 disabled:hover:brightness-100"
              disabled={loading || googleLoading}
              type="submit"
            >
              <span>{loading ? "Signing in..." : "Login"}</span>
              <ArrowRight className="h-4.5 w-4.5 transition duration-200 group-hover:translate-x-0.5" />
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-950/60 px-3 text-xs uppercase tracking-[0.24em] text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className={`transition duration-200 ${googleLoading ? "opacity-70" : ""}`}>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.2)] transition duration-200 hover:border-white/20 hover:shadow-[0_14px_36px_rgba(59,130,246,0.14)]">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  theme="outline"
                  size="large"
                  shape="pill"
                  width="100%"
                />
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
