import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-mist">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.25),_transparent_28%)]" />
      <div className="absolute inset-0 bg-grid bg-[size:38px_38px] opacity-40" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="hidden max-w-xl pr-12 lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-aqua">
            Team Flow
          </p>
          <h2 className="mt-6 text-5xl font-semibold leading-tight text-white">
            Manage projects and ship work without losing context.
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            DevCollab keeps authentication, projects, and task ownership connected so your team
            can stay aligned from login to delivery.
          </p>
        </div>
        <Outlet />
      </div>
    </main>
  );
}
