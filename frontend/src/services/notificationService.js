import api from "./api";

export const getNotifications = async (params = {}) => {
  const { data } = await api.get("/notifications", { params });
  return data;
};

export const markNotificationRead = async (notificationId) => {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data;
};

export const updateNotificationReadState = async (notificationId, read) => {
  const { data } = await api.patch(`/notifications/${notificationId}`, { read });
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch("/notifications/read-all");
  return data;
};
