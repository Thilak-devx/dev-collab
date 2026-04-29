import axios from "axios";

const defaultApiUrl =
  typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (
      error.response?.status === 401
      && !originalRequest.skipAuthRedirect
      && !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise =
          refreshPromise
          || api.post("/auth/refresh", null, { skipAuthRedirect: true }).finally(() => {
            refreshPromise = null;
          });

        await refreshPromise;
        return api(originalRequest);
      } catch {
        window.dispatchEvent(new Event("devcollab:unauthorized"));
      }
    } else if (error.response?.status === 401 && !originalRequest.skipAuthRedirect) {
      window.dispatchEvent(new Event("devcollab:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default api;
