import api from "./api";

export const getTaskFiles = async (taskId) => {
  const { data } = await api.get(`/tasks/${taskId}/files`);
  return data;
};

export const createTaskFile = async (taskId, values) => {
  const { data } = await api.post(`/tasks/${taskId}/files`, values);
  return data;
};

export const deleteTaskFile = async (taskId, fileId) => {
  const { data } = await api.delete(`/tasks/${taskId}/files/${fileId}`);
  return data;
};
