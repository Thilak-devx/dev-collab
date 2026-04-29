import { io } from "socket.io-client";

const getSocketUrl = () => {
  const apiUrl =
    import.meta.env.VITE_API_URL
    || (typeof window !== "undefined" ? `${window.location.origin}/api` : "/api");
  return apiUrl.replace(/\/api\/?$/, "");
};

const socket = io(getSocketUrl(), {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

export const getSocket = () => socket;
export default socket;

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

const emitWithAck = (eventName, payload) =>
  new Promise((resolve, reject) => {
    const activeSocket = getSocket();

    if (!activeSocket) {
      reject(new Error("Socket connection is not initialized"));
      return;
    }

    activeSocket.emit(eventName, payload, (response) => {
      if (response?.ok) {
        resolve(response);
        return;
      }

      reject(new Error(response?.message || "Socket request failed"));
    });
  });

export const joinProjectRoom = (projectId) => emitWithAck("joinProjectRoom", projectId);
export const joinProjectSocket = (projectId) => emitWithAck("join_project", projectId);

export const leaveProjectRoom = (projectId) => emitWithAck("leaveProjectRoom", projectId);

export const sendProjectMessage = (projectId, content) =>
  emitWithAck("send_message", { projectId, content });

export const joinSocketChannel = (channelId) => emitWithAck("join_channel", channelId);

export const sendChannelSocketMessage = (channelId, content) =>
  emitWithAck("send_message", { channelId, content });

export const joinChannelRoom = (projectId, channelId) =>
  emitWithAck("joinChannelRoom", { projectId, channelId });

export const leaveChannelRoom = (channelId) => emitWithAck("leaveChannelRoom", channelId);
