import { createContext, useEffect, useState } from "react";
import api from "../services/api";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
} from "../utils/authStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);
  const hasStoredSession = Boolean(getStoredToken() && getStoredUser());

  const clearAuthState = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthState();
      setLoading(false);
    };

    window.addEventListener("devcollab:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("devcollab:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!token || !hasStoredSession) {
      if (!hasStoredSession) {
        clearAuthState();
      }

      setLoading(false);
      return;
    }

    api
      .post("/auth/refresh", null, { skipAuthRedirect: true })
      .then(() => api.get("/auth/me", { skipAuthRedirect: true }))
      .then(({ data }) => {
        setUser(data);
        setToken("session");
        setStoredAuth(null, data);
      })
      .catch(() => {
        clearAuthState();
      })
      .finally(() => setLoading(false));
  }, [token, hasStoredSession]);

  const persistAuth = (authUser) => {
    setStoredAuth(null, authUser);
    setToken("session");
    setUser(authUser);
  };

  const login = async (values) => {
    const { data } = await api.post("/auth/login", values);
    persistAuth(data.user);
    return data;
  };

  const register = async (values) => {
    const { data } = await api.post("/auth/register", values);
    persistAuth(data.user);
    return data;
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post("/auth/google", { token: credential });
    persistAuth(data.user);
    return data;
  };

  const updateProfile = async (values) => {
    const { data } = await api.patch("/auth/profile", values);
    persistAuth(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", null, { skipAuthRedirect: true });
    } catch {
      // The client should still clear local auth even if the network request fails.
    }

    clearAuthState();
  };

  const deleteAccount = async () => {
    await api.delete("/auth/delete-account");
    clearAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        updateProfile,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
