import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareMore, MoreHorizontal, PencilLine, SendHorizonal, Trash2 } from "lucide-react";
import EmptyState from "./EmptyState";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { getProjectMessages } from "../../services/messageService";
import { connectSocket, getSocket, joinProjectSocket, sendProjectMessage } from "../../services/socket";

const formatTimestamp = (value) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const mergeMessages = (messages, incomingMessage) => {
  const merged = [...messages, incomingMessage];
  const unique = merged.filter(
    (message, index, list) => list.findIndex((entry) => entry._id === message._id) === index
  );

  return unique.sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
};

const decorateMessages = (messages, currentUserId) =>
  messages.map((message, index) => {
    const sender = message.senderId || {};
    const senderId = sender._id || sender.id || message.sender?._id || message.sender?.id;
    const isCurrentUser = senderId === currentUserId;
    const previous = messages[index - 1];
    const previousSender = previous?.senderId || {};
    const previousSenderId =
      previousSender._id || previousSender.id || previous?.sender?._id || previous?.sender?.id;
    const isGrouped = previousSenderId === senderId;

    return {
      ...message,
      sender,
      isCurrentUser,
      isGrouped,
      showMeta: !isGrouped,
    };
  });

export default function ProjectChat({ projectId, projectName }) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const messageListRef = useRef(null);
  const bottomRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      if (!projectId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getProjectMessages(projectId);
        setMessages(data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load messages");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [projectId]);

  useEffect(() => {
    if (!token || !projectId) {
      return undefined;
    }

    connectSocket();
    joinProjectSocket(projectId).catch(() => {});
    const socket = getSocket();

    if (!socket) {
      return undefined;
    }

    const handleReceiveMessage = (payload) => {
      const incomingProjectId =
        payload?.message?.projectId?._id
        || payload?.message?.projectId?.id
        || payload?.message?.projectId;

      if (incomingProjectId !== projectId) {
        return;
      }

      setMessages((current) => mergeMessages(current, payload.message));
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [projectId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const preparedMessages = useMemo(
    () => decorateMessages(messages, user?.id),
    [messages, user?.id]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setSending(true);

    try {
      const response = await sendProjectMessage(projectId, draft.trim());
      if (response?.message) {
        setMessages((current) => mergeMessages(current, response.message));
      }
      setDraft("");
    } catch (requestError) {
      const message = requestError.message || "Unable to send message";
      showToast({
        title: "Message failed",
        description: message,
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDraftKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!sending && draft.trim()) {
        handleSubmit(event);
      }
    }
  };

  return (
    <section className="app-panel-primary flex min-h-[640px] flex-col overflow-hidden p-0">
      <div className="border-b border-white/8 px-5 py-4">
        <p className="app-kicker">Project chat</p>
        <div className="mt-1 flex items-center gap-2">
          <MessageSquareMore className="h-4.5 w-4.5 text-brand-300" />
          <h3 className="text-xl font-semibold text-text-primary">
            {projectName || "Workspace conversation"}
          </h3>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Keep decisions, updates, and blockers visible to everyone in this project.
        </p>
      </div>

      <div ref={messageListRef} className="chat-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {loading ? (
          <div className="rounded-xl border border-white/8 bg-slate-950/35 px-4 py-6 text-sm text-text-muted">
            Loading conversation...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : preparedMessages.length ? (
          preparedMessages.map((message) => (
            <article
              key={message._id}
              className={`message-fade-in flex gap-3 ${message.isCurrentUser ? "justify-end" : ""} ${message.isGrouped ? "mt-[-0.35rem]" : ""}`}
            >
              {!message.isCurrentUser ? (
                message.showMeta ? (
                  <span className="app-avatar h-10 w-10 shrink-0 rounded-full">
                    {(message.sender.name || "DC")
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                ) : (
                  <span className="h-10 w-10 shrink-0" />
                )
              ) : null}

              <div className={`group max-w-[80%] ${message.isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                {message.showMeta ? (
                  <div className={`mb-1.5 flex items-center gap-2 px-1 ${message.isCurrentUser ? "justify-end" : ""}`}>
                    <p className="text-sm font-semibold text-text-primary">
                      {message.isCurrentUser ? "You" : message.sender.name || "Workspace member"}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                ) : null}

                <div
                  className={`relative rounded-2xl border px-4 py-3 shadow-[0_10px_24px_rgba(2,6,23,0.16)] transition-all duration-200 group-hover:-translate-y-[1px] ${
                    message.isCurrentUser
                      ? "border-brand-400/20 bg-brand-500/10"
                      : "border-white/8 bg-slate-950/65"
                  } ${message.isCurrentUser && message.isGrouped ? "rounded-tr-md" : ""} ${!message.isCurrentUser && message.isGrouped ? "rounded-tl-md" : ""}`}
                >
                  <div className={`absolute top-2 ${message.isCurrentUser ? "left-2" : "right-2"} flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100`}>
                    <button aria-label="Edit message" className="message-action-button" title="Edit message" type="button">
                      <PencilLine className="h-3.5 w-3.5" />
                    </button>
                    <button aria-label="More actions" className="message-action-button" title="More actions" type="button">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    <button aria-label="Delete message" className="message-action-button" title="Delete message" type="button">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 pr-16 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                    {message.content || message.body}
                  </p>
                </div>
              </div>

              {message.isCurrentUser ? (
                message.showMeta ? (
                  <span className="app-avatar h-10 w-10 shrink-0 rounded-full">
                    {(user?.name || "DC")
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                ) : (
                  <span className="h-10 w-10 shrink-0" />
                )
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState
            action={(
              <button
                className="app-action-button h-10 rounded-xl px-4 text-sm"
                onClick={() => setDraft("Hey team, here’s the latest update.")}
                type="button"
              >
                Start the conversation
              </button>
            )}
            description="No messages yet. Start the conversation rocket-fast and keep the whole team aligned."
            title="No messages yet. Start the conversation 🚀"
          />
        )}
        <div ref={bottomRef} />
      </div>

      <form className="border-t border-white/8 px-5 py-4" onSubmit={handleSubmit}>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="sr-only" htmlFor="project-chat-draft">
              Message
            </label>
            <textarea
              id="project-chat-draft"
              className="min-h-[56px] w-full rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              placeholder="Send a message to your project team"
              rows={2}
              value={draft}
            />
          </div>

          <button
            className="app-primary-button h-[56px] rounded-2xl px-4 text-sm font-medium text-white"
            disabled={sending || !draft.trim()}
            type="submit"
          >
            <SendHorizonal className="h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
