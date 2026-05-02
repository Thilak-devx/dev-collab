const STORAGE_KEYS = {
  session: "devcollab_session",
  user: "devcollab_user",
};

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const safeRead = (key) => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeWrite = (key, value) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota/privacy errors and continue with in-memory auth only.
  }
};

const safeRemove = (key) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
};

export const getStoredToken = () => (safeRead(STORAGE_KEYS.session) ? "session" : null);

export const getStoredUser = () => {
  const rawUser = safeRead(STORAGE_KEYS.user);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    safeRemove(STORAGE_KEYS.user);
    return null;
  }
};

export const setStoredAuth = (_token, user) => {
  safeWrite(STORAGE_KEYS.session, "1");

  if (user) {
    safeWrite(STORAGE_KEYS.user, JSON.stringify(user));
  }
};

export const clearStoredAuth = () => {
  safeRemove(STORAGE_KEYS.session);
  safeRemove(STORAGE_KEYS.user);
};
