import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useWorkspace from "../../hooks/useWorkspace";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";

export default function WorkspaceLayout({
  title,
  label = "Workspace",
  search = "",
  onSearchChange,
  searchPlaceholder = "Search",
  onPrimaryAction,
  primaryActionLabel = "New Project",
  primaryActionDisabled = false,
  showSearch = true,
  showPrimaryAction = true,
  onNotificationsClick,
  children,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    notifications,
    markNotificationRead,
    updateNotificationReadState,
    markAllNotificationsRead,
  } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isNotificationRead = (notification) =>
    typeof notification?.isRead === "boolean" ? notification.isRead : Boolean(notification?.read);

  const normalizeProjectId = (projectValue) => {
    if (!projectValue) {
      return "";
    }

    if (typeof projectValue === "string") {
      return projectValue;
    }

    return projectValue._id || projectValue.id || "";
  };

  const normalizeConversationId = (conversationValue) => {
    if (!conversationValue) {
      return "";
    }

    if (typeof conversationValue === "string") {
      return conversationValue;
    }

    return conversationValue._id || conversationValue.id || "";
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#030712_0%,#081226_58%,#0b1730_100%)] text-text-primary">
      <div className="mx-auto grid min-h-screen max-w-[1440px] gap-5 px-3 py-3 lg:grid-cols-[236px_minmax(0,1fr)] lg:px-4 lg:py-4">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />

        <div className="min-w-0 app-page-stack">
          <DashboardTopbar
            label={label}
            onMenuClick={() => setSidebarOpen(true)}
            onNewProject={onPrimaryAction}
            onSearchChange={onSearchChange}
            notifications={notifications}
            onMarkAllNotificationsRead={markAllNotificationsRead}
            onSelectNotification={async (notification) => {
              if (!isNotificationRead(notification)) {
                await markNotificationRead(notification._id);
              }

              if (notification.projectId?._id) {
                navigate(`/projects/${notification.projectId._id}`);
                return;
              }

              if (notification.projectId) {
                navigate(`/projects/${notification.projectId}`);
              }
            }}
            onOpenConversation={async (notification) => {
              if (!isNotificationRead(notification)) {
                await markNotificationRead(notification._id);
              }

              const projectId = normalizeProjectId(notification.projectId);
              const conversationId = normalizeConversationId(notification.conversationId);

              if (projectId) {
                navigate(`/projects/${projectId}`, {
                  state: {
                    activePanel: "chat",
                    conversationId,
                    from: location.pathname,
                  },
                });
                return;
              }

              if (conversationId) {
                navigate(`/messages/${conversationId}`, {
                  state: {
                    conversationId,
                    from: location.pathname,
                  },
                });
              }
            }}
            onToggleNotificationRead={async (notification, read) => {
              await updateNotificationReadState(notification._id, read);
            }}
            primaryActionDisabled={primaryActionDisabled}
            primaryActionLabel={primaryActionLabel}
            search={search}
            searchPlaceholder={searchPlaceholder}
            showPrimaryAction={showPrimaryAction}
            showSearch={showSearch}
            title={title}
          />

          {children}
        </div>
      </div>
    </main>
  );
}
