import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, MailCheck, MailOpen, MessageSquareText } from "lucide-react";

const formatRelativeTime = (value) => {
  if (!value) {
    return "just now";
  }

  const date = new Date(value);
  const diffInMs = Date.now() - date.getTime();
  const diffInMinutes = Math.max(Math.floor(diffInMs / (1000 * 60)), 0);

  if (diffInMinutes < 1) {
    return "just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  return `${Math.floor(diffInHours / 24)}d ago`;
};

export default function NotificationDropdown({
  notifications = [],
  onSelectNotification,
  onMarkAllRead,
  onToggleRead,
  onOpenConversation,
}) {
  const [open, setOpen] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [fadingIds, setFadingIds] = useState([]);

  const isNotificationRead = (notification) =>
    typeof notification.isRead === "boolean" ? notification.isRead : Boolean(notification.read);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !isNotificationRead(notification)).length,
    [notifications]
  );

  useEffect(() => {
    if (!open || !unreadCount || markingAllRead) {
      return;
    }

    let active = true;

    const markAll = async () => {
      setMarkingAllRead(true);

      try {
        await onMarkAllRead?.();
      } finally {
        if (active) {
          setMarkingAllRead(false);
        }
      }
    };

    markAll();

    return () => {
      active = false;
    };
  }, [markingAllRead, onMarkAllRead, open, unreadCount]);

  const canOpenConversation = (notification) =>
    Boolean(notification?.projectId || notification?.conversationId);

  const runReadTransition = async (notification, nextRead, handler) => {
    const notificationId = notification._id || notification.id;

    if (nextRead && notificationId) {
      setFadingIds((current) => [...new Set([...current, notificationId])]);
    }

    try {
      await handler();
    } finally {
      if (nextRead && notificationId) {
        window.setTimeout(() => {
          setFadingIds((current) => current.filter((entry) => entry !== notificationId));
        }, 320);
      }
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount ? (
          <span className="absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="app-popover-enter absolute right-0 top-12 z-30 w-[360px] overflow-hidden rounded-xl border border-slate-700/90 bg-[rgba(15,23,42,0.95)] shadow-[0_24px_60px_rgba(2,6,23,0.62),0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-xl">
          <div className="border-b border-slate-700/80 bg-[rgba(15,23,42,0.96)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Notifications</p>
                <p className="mt-1 text-xs text-slate-300">
                  {unreadCount ? `${unreadCount} unread updates` : "You are all caught up"}
                </p>
              </div>
              {notifications.length ? (
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-600/80 bg-slate-800/90 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-700/90"
                  onClick={async () => {
                    await onMarkAllRead();
                  }}
                  disabled={markingAllRead || !unreadCount}
                  type="button"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {markingAllRead ? "Updating..." : "Mark all read"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="bg-[rgba(15,23,42,0.95)] p-4">
            {notifications.length ? (
              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`rounded-xl border px-3.5 py-3 transition-all duration-300 ${
                      isNotificationRead(notification)
                        ? "border-slate-700/75 bg-slate-900/95"
                        : "border-sky-500/30 bg-[linear-gradient(180deg,rgba(14,165,233,0.08),rgba(15,23,42,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    } ${fadingIds.includes(notification._id) ? "scale-[0.985] opacity-70" : "opacity-100"} hover:border-slate-500/80 hover:bg-slate-800`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        onClick={() => {
                          onSelectNotification(notification);
                          setOpen(false);
                        }}
                        type="button"
                      >
                        <span
                          className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                            isNotificationRead(notification) ? "bg-slate-500" : "bg-sky-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm leading-6 text-slate-100">
                            {notification.message}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                            {!isNotificationRead(notification) ? (
                              <button
                                className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-100 transition hover:border-sky-400/40 hover:bg-sky-500/15"
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  await runReadTransition(notification, true, () =>
                                    onToggleRead(notification, true)
                                  );
                                }}
                                type="button"
                              >
                                Mark as read
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </button>

                      <div className="mt-0.5 flex items-center gap-2">
                        {canOpenConversation(notification) ? (
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/90 text-slate-200 transition hover:-translate-y-[1px] hover:border-sky-500/60 hover:bg-slate-700 hover:text-white"
                            onClick={() => {
                              onOpenConversation?.(notification);
                              setOpen(false);
                            }}
                            title="Open conversation"
                            type="button"
                          >
                            <MessageSquareText className="h-3.5 w-3.5" />
                          </button>
                        ) : null}

                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/90 text-slate-200 transition hover:border-slate-500 hover:bg-slate-700 hover:text-white"
                          onClick={async () => {
                            await runReadTransition(notification, !isNotificationRead(notification), () =>
                              onToggleRead(notification, !isNotificationRead(notification))
                            );
                          }}
                          title={isNotificationRead(notification) ? "Mark as unread" : "Mark as read"}
                          type="button"
                        >
                          {isNotificationRead(notification) ? (
                            <MailOpen className="h-3.5 w-3.5" />
                          ) : (
                            <MailCheck className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/95 px-4 py-8 text-center">
                <p className="text-sm font-medium text-white">No notifications yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Invites, assignments, and joins will show up here as your workspace gets busy.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
