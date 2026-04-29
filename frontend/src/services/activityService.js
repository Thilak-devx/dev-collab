import api from "./api";

export const getActivities = async (params = {}) => {
  const { data } = await api.get("/activities", { params });
  return data;
};
