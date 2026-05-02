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

const socketConnectionTimeoutMs = 10000;
const socketAckTimeoutMs = 10000;
let pendingConnectionPromise = null;

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
  waitForSocketConnection().then(
    (activeSocket) =>
      new Promise((resolve, reject) => {
        activeSocket.timeout(socketAckTimeoutMs).emit(eventName, payload, (error, response) => {
          if (error) {
            reject(new Error("Realtime request timed out"));
            return;
          }

          if (response?.ok) {
            resolve(response);
            return;
          }

          reject(new Error(response?.message || "Socket request failed"));
        });
      })
  );

const waitForSocketConnection = () => {
  const activeSocket = getSocket();

  if (!activeSocket) {
    return Promise.reject(new Error("Socket connection is not initialized"));
  }

  if (activeSocket.connected) {
    return Promise.resolve(activeSocket);
  }

  if (pendingConnectionPromise) {
    return pendingConnectionPromise;
  }

  pendingConnectionPromise = new Promise((resolve, reject) => {
    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      activeSocket.off("connect", handleConnect);
      activeSocket.off("connect_error", handleConnectError);
      pendingConnectionPromise = null;
    };

    const handleConnect = () => {
      cleanup();
      resolve(activeSocket);
    };

    const handleConnectError = (error) => {
      cleanup();
      reject(new Error(error?.message || "Unable to connect to realtime service"));
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Realtime connection timed out"));
    }, socketConnectionTimeoutMs);

    activeSocket.once("connect", handleConnect);
    activeSocket.once("connect_error", handleConnectError);
    activeSocket.connect();
  });

  return pendingConnectionPromise;
};

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
