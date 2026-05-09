const trimEnvValue = (value) => (typeof value === "string" ? value.trim() : "");

const defaultApiUrl =
  typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

export const publicEnv = {
  apiUrl: trimEnvValue(import.meta.env.VITE_API_URL) || defaultApiUrl,
  googleClientId: trimEnvValue(import.meta.env.VITE_GOOGLE_CLIENT_ID),
  supabaseUrl: trimEnvValue(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: trimEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY),
};

export const hasConfiguredPublicEnv = (key) => Boolean(publicEnv[key]);
