import api from "./api";

export const getTasks = async (params = {}) => {
  const { data } = await api.get("/tasks", { params });
  return data;
};

export const createTask = async (values) => {
  const { data } = await api.post("/tasks", values);
  return data;
};

export const updateTask = async (taskId, values) => {
  const { data } = await api.patch(`/tasks/${taskId}`, values);
  return data;
};

export const deleteTask = async (taskId) => {
  const { data } = await api.delete(`/tasks/${taskId}`);
  return data;
};
