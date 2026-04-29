import api from "./api";

export const createInvite = async ({ projectId, regenerate = false, maxUses = null } = {}) => {
  const { data } = await api.post("/invites", {
    projectId,
    regenerate,
    maxUses,
  });
  return data;
};

export const getInviteDetails = async (token) => {
  const { data } = await api.get(`/invites/${token}`);
  return data;
};

export const joinInvite = async (token) => {
  const { data } = await api.post(`/invites/${token}/join`);
  return data;
};
