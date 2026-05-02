import axios from "axios";

const defaultApiUrl =
  typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const normalizeApiBaseUrl = (value) => {
  const rawValue = typeof value === "string" ? value.trim() : "";

  if (!rawValue) {
    return defaultApiUrl;
  }

  if (/\/api\/?$/i.test(rawValue)) {
    return rawValue.replace(/\/+$/, "");
  }

  return `${rawValue.replace(/\/+$/, "")}/api`;
};

export const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const requestUrl = `${originalRequest.baseURL || API_URL}${originalRequest.url || ""}`;

    if (error.response) {
      console.error("API request failed:", {
        url: requestUrl,
        method: originalRequest.method,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error("API request did not receive a response:", {
        url: requestUrl,
        method: originalRequest.method,
        message: error.message,
      });
    } else {
      console.error("API request setup failed:", {
        url: requestUrl,
        method: originalRequest.method,
        message: error.message,
      });
    }

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
