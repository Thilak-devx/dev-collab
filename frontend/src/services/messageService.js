import api from "./api";

export const getProjectMessages = async (projectId) => {
  const { data } = await api.get(`/messages/project/${projectId}`);
  return data;
};

export const getProjectChannels = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/channels`);
  return data;
};

export const createProjectChannel = async (projectId, values) => {
  const payload = {
    name: values.name,
    projectId,
  };

  const { data } = await api.post(`/projects/${projectId}/channels`, payload);
  return data;
};

export const createMessage = async (values) => {
  const { data } = await api.post("/messages", values);
  return data;
};

export const getChannelMessages = async (projectId, channelId, params = {}) => {
  const { data } = await api.get(`/messages/${channelId}`, {
    params,
  });
  return data;
};

export const createChannelMessage = async (projectId, channelId, values) => {
  const { data } = await api.post(`/projects/${projectId}/channels/${channelId}/messages`, values);
  return data;
};
