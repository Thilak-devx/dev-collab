import {
  CalendarDays,
  Files,
  FolderKanban,
  LayoutDashboard,
  MessageSquareText,
  PanelLeftClose,
  Settings,
  SquareKanban,
  Users,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", end: true },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Tasks", icon: SquareKanban, path: "/tasks" },
  { label: "Team", icon: Users, path: "/team" },
  { label: "Calendar", icon: CalendarDays, path: "/calendar" },
  { label: "Messages", icon: MessageSquareText, path: "/messages" },
  { label: "Files", icon: Files, path: "/files" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function DashboardSidebar({ user, isOpen, onClose }) {
  const navigate = useNavigate();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-sm transition lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-3 left-3 z-40 flex w-[236px] flex-col rounded-2xl border border-white/8 bg-[rgba(8,13,25,0.84)] p-3 shadow-[0_24px_64px_rgba(2,6,23,0.48)] backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"
        }`}
      >
        <div className="mb-5 flex items-center justify-between px-2 pt-1 lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-blue-500 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(79,70,229,0.35)]">
              D
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">DevCollab</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-text-subtle">
                Workspace
              </p>
            </div>
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/6 hover:text-text-primary lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                end={item.end}
                key={item.label}
                onClick={onClose}
                to={item.path}
                className={({ isActive }) =>
                  `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.07] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "text-text-muted hover:translate-x-[1px] hover:bg-white/[0.04] hover:text-text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-brand-500/18 text-brand-300"
                          : "text-text-subtle group-hover:bg-white/[0.05] group-hover:text-text-primary"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-brand-300" /> : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 text-xs font-semibold text-slate-950">
              {(user?.name || "DC")
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {user?.name || "DevCollab User"}
              </p>
              <p className="truncate text-xs text-text-muted">{user?.email || "Workspace member"}</p>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/[0.06] hover:text-text-primary"
              onClick={() => {
                navigate("/settings");
                onClose?.();
              }}
              type="button"
            >
              <PanelLeftClose className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
