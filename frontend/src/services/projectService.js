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
  console.info("Creating project payload:", values);

  try {
    const { data } = await api.post("/projects", values);
    console.info("Create project response:", data);
    return data.project || data;
  } catch (error) {
    console.error("Create project API error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
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
