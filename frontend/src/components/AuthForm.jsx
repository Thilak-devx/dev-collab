import { Link } from "react-router-dom";

export default function AuthForm({
  mode,
  values,
  onChange,
  onSubmit,
  error,
  loading,
}) {
  const isRegister = mode === "register";

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-panel backdrop-blur">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-aqua">
          DevCollab
        </p>
        <h1 className="text-3xl font-semibold text-white">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          {isRegister
            ? "Start organizing projects, tasks, and your team from one place."
            : "Sign in to continue managing your active projects."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {isRegister ? (
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Name</span>
            <input
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-aqua"
              name="name"
              placeholder="Your name"
              value={values.name}
              onChange={onChange}
              required
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Email</span>
          <input
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-aqua"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={onChange}
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Password</span>
          <input
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-aqua"
            name="password"
            type="password"
            placeholder="••••••••"
            value={values.password}
            onChange={onChange}
            required
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button
          className="auth-submit-button"
          disabled={loading}
          type="submit"
        >
          {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <Link className="font-medium text-aqua hover:text-teal-300" to={isRegister ? "/login" : "/register"}>
          {isRegister ? "Login" : "Register"}
        </Link>
      </p>
    </div>
  );
}
