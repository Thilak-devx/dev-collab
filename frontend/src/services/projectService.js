import api from "./api";

export const getProjects = async () => {
  const { data } = await api.get("/projects");
  return data;
};

export const getProject = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
};

export const createProject = async (values) => {
  const { data } = await api.post("/projects", values);
  return data.project || data;
};

export const getProjectTasks = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/tasks`);
  return data;
};

export const inviteProjectMember = async (projectId, email) => {
  const { data } = await api.post(`/projects/${projectId}/invite`, { email });
  return data.project || data;
};

export const deleteProject = async (projectId) => {
  const { data } = await api.delete(`/projects/${projectId}`);
  return data;
};
