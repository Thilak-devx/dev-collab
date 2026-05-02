import { useEffect, useRef, useState } from "react";
import {
  Hash,
  MoreHorizontal,
  PencilLine,
  Plus,
  SendHorizonal,
  Trash2,
  Users,
} from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";
import EmptyState from "../components/dashboard/EmptyState";
import CreateChannelModal from "../components/dashboard/CreateChannelModal";
import { SkeletonList } from "../components/dashboard/LoadingSkeleton";
import SectionHeader from "../components/dashboard/SectionHeader";
import useAuth from "../hooks/useAuth";
import useChannelRoom from "../hooks/useChannelRoom";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import {
  createMessage,
  createProjectChannel,
  deleteProjectChannel,
  getChannelMessages,
  getProjectChannels,
} from "../services/messageService";
import { connectSocket, getSocket } from "../services/socket";

const formatMessageTime = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const replaceChannelInList = (channels, channel) => [
  ...channels.filter((entry) => entry._id !== channel._id),
  channel,
].sort((first, second) => {
  if (first.isDefault && !second.isDefault) {
    return -1;
  }

  if (!first.isDefault && second.isDefault) {
    return 1;
  }

  return new Date(first.createdAt) - new Date(second.createdAt);
});

const mergeMessage = (messages, message) => {
  const nextMessages = [...messages, message];
  const uniqueMessages = nextMessages.filter(
    (entry, index, list) => list.findIndex((candidate) => candidate._id === entry._id) === index
  );

  return uniqueMessages.sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
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

export default function MessagesPage() {
  const { conversationId } = useParams();
  const location = useLocation();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { projects, loading: workspaceLoading } = useWorkspace();
  const [selectedProject, setSelectedProject] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [pageError, setPageError] = useState("");
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [createChannelLoading, setCreateChannelLoading] = useState(false);
  const [createChannelError, setCreateChannelError] = useState("");
  const [channelActionLoadingId, setChannelActionLoadingId] = useState("");
  const [unreadByChannel, setUnreadByChannel] = useState({});
  const messageListRef = useRef(null);
  const bottomRef = useRef(null);
  const pendingProjectId = location.state?.projectId || "";
  const selectedProjectId = selectedProject?._id || "";
  const selectedChannel = channels.find((channel) => channel._id === selectedChannelId) || null;

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSelectedChannelId("");
    setPageError("");
  };

  useEffect(() => {
    if (!projects.length) {
      setSelectedProject(null);
      return;
    }

    if (pendingProjectId) {
      const pendingProject = projects.find((project) => project._id === pendingProjectId);

      if (pendingProject) {
        setSelectedProject((current) =>
          current?._id === pendingProject._id ? current : pendingProject
        );
        return;
      }
    }

    if (!selectedProject || !projects.some((project) => project._id === selectedProject._id)) {
      setSelectedProject(projects[0]);
    }
  }, [pendingProjectId, projects, selectedProject]);

  useChannelRoom(selectedProjectId, selectedChannelId);

  useEffect(() => {
    const loadChannels = async () => {
      if (!selectedProjectId) {
        setChannels([]);
        setSelectedChannelId("");
        setPageLoading(false);
        setChannelsLoading(false);
        return;
      }

      setChannelsLoading(true);
      setPageError("");

      try {
        const data = await getProjectChannels(selectedProjectId);
        setChannels(data);

        const nextChannel =
          data.find((channel) => channel._id === conversationId)
          || data.find((channel) => channel._id === location.state?.conversationId)
          || data.find((channel) => channel._id === selectedChannelId)
          || data[0];
        setSelectedChannelId(nextChannel?._id || "");
      } catch (err) {
        setPageError(err.response?.data?.message || "Unable to load channels");
      } finally {
        setPageLoading(false);
        setChannelsLoading(false);
      }
    };

    loadChannels();
  }, [conversationId, location.state?.conversationId, selectedProjectId]);

  useEffect(() => {
    if (selectedChannelId || !channels.length) {
      return;
    }

    setSelectedChannelId(channels[0]._id);
  }, [channels, selectedChannelId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChannel) {
        setMessages([]);
        return;
      }

      setMessagesLoading(true);
      setPageError("");

      try {
        const data = await getChannelMessages(selectedProjectId, selectedChannel._id);
        setMessages(data);
        setUnreadByChannel((current) => ({ ...current, [selectedChannel._id]: 0 }));
      } catch (err) {
        setPageError(err.response?.data?.message || "Unable to load messages");
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedChannel, selectedProjectId]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    connectSocket();
    const socket = getSocket();

    if (!socket) {
      return undefined;
    }

    const handleChannelCreated = (payload) => {
      if (!payload?.channel || !payload?.project) {
        return;
      }

      if (payload.project._id !== selectedProjectId && payload.project.id !== selectedProjectId) {
        return;
      }

      setChannels((current) => replaceChannelInList(current, payload.channel));
    };

    const handleMessageCreated = (payload) => {
      const incomingChannelId = payload?.message?.channelId?._id
        || payload?.message?.channelId?.id
        || payload?.message?.channelId
        || payload?.channel?._id;

      const incomingProjectId = payload?.message?.projectId?._id
        || payload?.message?.projectId?.id
        || payload?.message?.projectId
        || payload?.project?._id;

      if (!incomingChannelId || !incomingProjectId) {
        return;
      }

      if (incomingProjectId === selectedProjectId && incomingChannelId === selectedChannelId) {
        setMessages((current) => mergeMessage(current, payload.message));
        return;
      }

      setUnreadByChannel((current) => ({
        ...current,
        [incomingChannelId]: (current[incomingChannelId] || 0) + 1,
      }));

      if (payload.message?.senderId?._id !== user?.id) {
        showToast({
          title: `New message in #${payload.channel?.slug || "channel"}`,
          description: payload.message?.body || "A teammate sent a new message.",
          type: "success",
        });
      }
    };

    const handleReceiveMessage = (payload) => {
      const incomingMessage = payload?.message || payload;
      const incomingChannelId = incomingMessage?.channelId?._id
        || incomingMessage?.channelId?.id
        || incomingMessage?.channelId
        || payload?.channel?._id;

      if (!incomingChannelId) {
        return;
      }

      if (incomingChannelId !== selectedChannelId) {
        setUnreadByChannel((current) => ({
          ...current,
          [incomingChannelId]: (current[incomingChannelId] || 0) + 1,
        }));
        return;
      }

      setMessages((prev) => mergeMessage(prev, incomingMessage));
    };

    const handleChannelDeleted = (payload) => {
      const removedChannelId = payload?.channelId;

      if (!removedChannelId) {
        return;
      }

      setChannels((current) => current.filter((channel) => channel._id !== removedChannelId));
      setUnreadByChannel((current) => {
        const nextState = { ...current };
        delete nextState[removedChannelId];
        return nextState;
      });

      if (selectedChannelId === removedChannelId) {
        setSelectedChannelId("");
        setMessages([]);
      }
    };

    socket.on("channelCreated", handleChannelCreated);
    socket.on("messageCreated", handleMessageCreated);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("channelDeleted", handleChannelDeleted);

    return () => {
      socket.off("channelCreated", handleChannelCreated);
      socket.off("messageCreated", handleMessageCreated);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("channelDeleted", handleChannelDeleted);
    };
  }, [selectedChannelId, selectedProjectId, showToast, token, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token || !selectedChannel) {
      return;
    }

    const activeSocket = connectSocket();
    activeSocket.emit("join_channel", selectedChannel._id);
  }, [selectedChannel, token]);

  const handleCreateChannel = async (values) => {
    if (!values?.name?.trim() || !selectedProject) {
      alert("Select a project first");
      setCreateChannelError("Select a project before creating a channel.");
      return;
    }

    if (!selectedProjectId) {
      setCreateChannelError("Select a project before creating a channel.");
      return;
    }

    setCreateChannelLoading(true);
    setCreateChannelError("");

    try {
      const channel = await createProjectChannel(selectedProjectId, values);
      setChannels((current) => replaceChannelInList(current, channel));
      setSelectedChannelId(channel._id);
      setShowCreateChannelModal(false);
      showToast({
        title: "Channel created",
        description: `#${channel.slug} is ready for conversation.`,
        type: "success",
      });
    } catch (err) {
      const message = err.response?.data?.message || "Unable to create channel";
      setCreateChannelError(message);
      showToast({
        title: "Channel creation failed",
        description: message,
        type: "error",
      });
    } finally {
      setCreateChannelLoading(false);
    }
  };

  const handleDeleteChannel = async (channel) => {
    if (!selectedProjectId || !channel?._id) {
      return;
    }

    if (channel.isDefault) {
      showToast({
        title: "Channel cannot be deleted",
        description: "The default channel must stay available for the project.",
        type: "error",
      });
      return;
    }

    setChannelActionLoadingId(channel._id);

    try {
      await deleteProjectChannel(selectedProjectId, channel._id);

      const remainingChannels = channels.filter((entry) => entry._id !== channel._id);
      setChannels(remainingChannels);
      setUnreadByChannel((current) => {
        const nextState = { ...current };
        delete nextState[channel._id];
        return nextState;
      });

      if (selectedChannelId === channel._id) {
        setSelectedChannelId(remainingChannels[0]?._id || "");
        setMessages([]);
      }

      showToast({
        title: "Channel deleted",
        description: `#${channel.slug} has been removed.`,
        type: "success",
      });
    } catch (err) {
      showToast({
        title: "Unable to delete channel",
        description: err.response?.data?.message || "Unable to delete channel",
        type: "error",
      });
    } finally {
      setChannelActionLoadingId("");
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!draft.trim() || !selectedChannel) {
      return;
    }

    setMessageSending(true);

    try {
      const message = {
        content: draft.trim(),
        channelId: selectedChannel._id,
      };

      const savedMessage = await createMessage(message);
      setMessages((current) => mergeMessage(current, savedMessage));
      setUnreadByChannel((current) => ({ ...current, [selectedChannel._id]: 0 }));
      const activeSocket = connectSocket();
      activeSocket.emit("send_message", savedMessage);
      setDraft("");
    } catch (err) {
      showToast({
        title: "Unable to send message",
        description: err.response?.data?.message || "Unable to send message",
        type: "error",
      });
    } finally {
      setMessageSending(false);
    }
  };

  const handleDraftKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!messageSending && draft.trim()) {
        handleSendMessage(event);
      }
    }
  };

  const currentChannel = selectedChannel;
  const preparedMessages = decorateMessages(messages, user?.id);

  return (
    <WorkspaceLayout
      label="Messages"
      onPrimaryAction={() => setShowCreateChannelModal(true)}
      primaryActionDisabled={!selectedProjectId}
      primaryActionLabel="New Channel"
      showSearch={false}
      title="Messages"
    >
      {pageError ? (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {pageError}
        </section>
      ) : null}

      {!workspaceLoading && !projects.length ? (
        <EmptyState
          action={null}
          description="Create a project first, then start real-time conversations with your team inside dedicated channels."
          title="No project workspaces yet"
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[280px_280px_minmax(0,1fr)]">
          <aside className="app-panel-primary p-4">
            <SectionHeader label="Projects" title="Your workspaces" />
            <div className="mt-4 space-y-2">
              {projects.map((project) => (
                <button
                  key={project._id}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    selectedProjectId === project._id
                      ? "border-brand-400/20 bg-brand-500/10 text-text-primary"
                      : "border-white/8 bg-slate-950/60 text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
                  }`}
                  onClick={() => handleProjectSelect(project)}
                  type="button"
                >
                  <p className="text-sm font-semibold">{project.name}</p>
                  <p className="mt-1 text-xs text-text-subtle">
                    {project.members?.length || 0} members
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <aside className="app-panel-primary p-4">
            <div className="flex items-center justify-between gap-3">
              <SectionHeader label="Channels" title={selectedProject?.name || "Project channels"} />
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-text-muted transition hover:bg-white/[0.07] hover:text-text-primary"
                disabled={!selectedProjectId}
                onClick={() => setShowCreateChannelModal(true)}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {channelsLoading ? (
                <SkeletonList rows={3} />
              ) : channels.length ? (
                channels.map((channel) => (
                  <div
                    key={channel._id}
                    className={`flex items-center gap-2 rounded-xl border px-2 py-2 transition ${
                      selectedChannelId === channel._id
                        ? "border-sky-400/20 bg-sky-400/10"
                        : "border-white/8 bg-slate-950/60 hover:bg-white/[0.05]"
                    }`}
                  >
                    <button
                      className="flex min-w-0 flex-1 items-center justify-between gap-3 px-2 py-1 text-left text-text-muted transition hover:text-text-primary"
                      onClick={() => setSelectedChannelId(channel._id)}
                      type="button"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <Hash className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm font-medium">{channel.slug}</span>
                      </span>
                      {unreadByChannel[channel._id] ? (
                        <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[11px] font-semibold text-brand-200">
                          {unreadByChannel[channel._id]}
                        </span>
                      ) : null}
                    </button>

                    {!channel.isDefault ? (
                      <button
                        aria-label={`Delete ${channel.slug} channel`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.04] text-text-subtle transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={channelActionLoadingId === channel._id}
                        onClick={() => handleDeleteChannel(channel)}
                        title="Delete channel"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState
                  action={(
                    <button
                      className="app-primary-button h-10 rounded-xl px-4 text-sm font-medium text-white"
                      onClick={() => setShowCreateChannelModal(true)}
                      type="button"
                    >
                      Create channel
                    </button>
                  )}
                  description="Keep discussions organized with channels for design, engineering, launches, or support."
                  title="No channels yet"
                />
              )}
            </div>
          </aside>

          <section className="app-panel-primary flex min-h-[720px] flex-col p-0">
            {currentChannel ? (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
                  <div>
                    <p className="app-kicker">Project chat</p>
                    <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-text-primary">
                      <Hash className="h-4.5 w-4.5 text-brand-300" />
                      {currentChannel.slug}
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-medium text-text-subtle">
                    <Users className="h-3.5 w-3.5" />
                    {selectedProject?.members?.length || 0} members
                  </div>
                </div>

                <div
                  ref={messageListRef}
                  className="chat-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-5"
                >
                  {messagesLoading ? (
                    <SkeletonList rows={4} />
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

                        <div className={`group max-w-[78%] ${message.isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                          {message.showMeta ? (
                            <div className={`mb-1.5 flex items-center gap-2 px-1 ${message.isCurrentUser ? "justify-end" : ""}`}>
                              <p className="text-sm font-semibold text-text-primary">
                                {message.isCurrentUser ? "You" : message.sender.name || "Workspace member"}
                              </p>
                              <span className="text-[11px] text-slate-500">
                                {formatMessageTime(message.createdAt)}
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
                              <button
                                aria-label="Edit message"
                                className="message-action-button"
                                title="Edit message"
                                type="button"
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                              </button>
                              <button
                                aria-label="More actions"
                                className="message-action-button"
                                title="More actions"
                                type="button"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                              <button
                                aria-label="Delete message"
                                className="message-action-button"
                                title="Delete message"
                                type="button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="pr-16 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                              {message.body || message.content}
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
                          onClick={() => setDraft("Hey team, let's kick this off.")}
                          type="button"
                        >
                          Start the conversation
                        </button>
                      )}
                      description="No messages yet. Start the conversation and keep the whole team aligned."
                      title="No messages yet. Start the conversation"
                    />
                  )}
                  <div ref={bottomRef} />
                </div>

                <form
                  className="border-t border-white/8 px-5 py-4"
                  onSubmit={handleSendMessage}
                >
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="sr-only" htmlFor="message-draft">
                        Message
                      </label>
                      <textarea
                        id="message-draft"
                        className="min-h-[52px] w-full rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={handleDraftKeyDown}
                        placeholder={`Message #${currentChannel.slug}`}
                        rows={2}
                        value={draft}
                      />
                    </div>
                    <button
                      className="app-primary-button h-[52px] rounded-2xl px-4 text-sm font-medium text-white"
                      disabled={messageSending || !draft.trim()}
                      type="submit"
                    >
                      <SendHorizonal className="h-4 w-4" />
                      {messageSending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-6">
                <EmptyState
                  action={(
                    <button
                      className="app-primary-button h-10 rounded-xl px-4 text-sm font-medium text-white"
                      onClick={() => setShowCreateChannelModal(true)}
                      type="button"
                    >
                      Create channel
                    </button>
                  )}
                  description="Select a project and channel to start collaborating live with your team."
                  title="Choose a conversation"
                />
              </div>
            )}
          </section>
        </section>
      )}

      <CreateChannelModal
        error={createChannelError}
        loading={createChannelLoading}
        onClose={() => setShowCreateChannelModal(false)}
        onSubmit={handleCreateChannel}
        open={showCreateChannelModal}
        submitDisabled={!selectedProject}
      />
    </WorkspaceLayout>
  );
}
