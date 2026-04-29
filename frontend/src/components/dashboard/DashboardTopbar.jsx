import { Menu, Plus, Search } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

export default function DashboardTopbar({
  label = "Overview",
  title = "Dashboard",
  search = "",
  onSearchChange,
  searchPlaceholder = "Search projects",
  onMenuClick,
  onNewProject,
  notifications = [],
  onSelectNotification,
  onOpenConversation,
  onMarkAllNotificationsRead,
  onToggleNotificationRead,
  primaryActionLabel = "New Project",
  primaryActionDisabled = false,
  showSearch = true,
  showPrimaryAction = true,
}) {
  return (
    <header className="sticky top-3 z-20 flex flex-col gap-3 rounded-2xl border border-white/8 bg-[rgba(10,15,28,0.84)] px-4 py-3 shadow-[0_16px_34px_rgba(2,6,23,0.22)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
            {label}
          </p>
          <h1 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.03em] text-text-primary">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {showSearch ? (
          <label className="relative block min-w-[240px] max-w-[360px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
            <input
              className="app-input h-10 w-full pl-10 pr-3"
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              value={search}
            />
          </label>
        ) : null}

        <NotificationDropdown
          notifications={notifications}
          onMarkAllRead={onMarkAllNotificationsRead}
          onOpenConversation={onOpenConversation}
          onSelectNotification={onSelectNotification}
          onToggleRead={onToggleNotificationRead}
        />

        {showPrimaryAction ? (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 text-sm font-medium text-white shadow-[0_10px_28px_rgba(79,70,229,0.25)] transition hover:-translate-y-[1px] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={primaryActionDisabled}
            onClick={onNewProject}
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>{primaryActionLabel}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
