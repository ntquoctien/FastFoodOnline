import axios from "axios";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

export const StoreContext = createContext(null);

const AUTH_KEY = "adminAuth";
const apiBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

const buildAvatarUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const trimmedBase = (apiBaseUrl || "").replace(/\/+$/, "");
  const cleaned = value.replace(/^\/+/, "");
  const hasPrefix =
    cleaned.startsWith("images/") || cleaned.startsWith("uploads/");
  if (!trimmedBase) {
    return hasPrefix ? `/${cleaned}` : `/images/${cleaned}`;
  }
  return hasPrefix ? `${trimmedBase}/${cleaned}` : `${trimmedBase}/images/${cleaned}`;
};

const normaliseUserProfile = (rawUser) => {
  if (!rawUser) return null;
  const base =
    typeof rawUser === "object" && rawUser !== null ? { ...rawUser } : rawUser;
  if (typeof base !== "object" || base === null) {
    return null;
  }
  const candidate =
    base.avatarPath ||
    (typeof base.avatar === "string" ? base.avatar : "") ||
    (typeof base.avatarUrl === "string" && !/^https?:\/\//i.test(base.avatarUrl)
      ? base.avatarUrl
      : "");
  const avatarPath = (candidate || "")
    .replace(/^\/+/, "")
    .replace(/^images\//, "")
    .replace(/^uploads\//, "");
  const resolvedUrl =
    typeof base.avatarUrl === "string" && /^https?:\/\//i.test(base.avatarUrl)
      ? base.avatarUrl
      : buildAvatarUrl(avatarPath || base.avatarUrl || "");

  return {
    ...base,
    avatarPath,
    avatarUrl: resolvedUrl || "",
  };
};

const getStorageByType = (type) => {
  if (typeof window === "undefined") return null;
  if (type === "local") return window.localStorage;
  if (type === "session") return window.sessionStorage;
  return null;
};

const readStoredAuth = () => {
  if (typeof window === "undefined") return null;
  const sources = [
    { type: "local", storage: window.localStorage },
    { type: "session", storage: window.sessionStorage },
  ];

  for (const { type, storage } of sources) {
    const raw = storage.getItem(AUTH_KEY);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      return {
        token: parsed.token || "",
        role: parsed.role || "",
        branchId: parsed.branchId || "",
        user: normaliseUserProfile(parsed.user),
        remember: parsed.remember ?? type === "local",
        storageType: type,
      };
    } catch (error) {
      console.warn("Failed to parse stored auth", error);
    }
  }
  return null;
};

const StoreContextProvider = (props) => {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [branchId, setBranchId] = useState("");
  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [authStorage, setAuthStorage] = useState(null);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      const normalisedUser = normaliseUserProfile(stored.user);
      setToken(stored.token);
      setRole(stored.role);
      setBranchId(stored.branchId);
      setUser(normalisedUser);
      setProfileLoaded(Boolean(normalisedUser));
      setAuthStorage(stored.storageType);
    }
  }, []);

  const persistAuth = (
    {
      token: nextToken,
      role: nextRole,
      branchId: nextBranchId,
      user: nextUser,
    },
    options = {}
  ) => {
    const remember = Boolean(options.remember);
    const storageType = remember ? "local" : "session";
    const storage = getStorageByType(storageType);
    if (!storage) return;

    const normalisedUser = normaliseUserProfile(nextUser);
    const otherStorage = getStorageByType(storageType === "local" ? "session" : "local");
    const record = {
      token: nextToken || "",
      role: nextRole || "",
      branchId: nextBranchId || "",
      user: normalisedUser,
      remember,
    };

    storage.setItem(AUTH_KEY, JSON.stringify(record));
    if (otherStorage) {
      otherStorage.removeItem(AUTH_KEY);
    }

    setAuthStorage(storageType);
    setToken(record.token);
    setRole(record.role);
    setBranchId(record.branchId);
    setUser(normalisedUser);
    setProfileLoaded(Boolean(normalisedUser));
  };

  const clearAuth = () => {
    setToken("");
    setRole("");
    setBranchId("");
    setUser(null);
    setProfileLoaded(false);
    setAuthStorage(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_KEY);
      window.sessionStorage.removeItem(AUTH_KEY);
    }
  };

  const fetchProfile = useCallback(async () => {
    if (!token || profileLoading) return null;
    setProfileLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/user/profile`, {
        headers: { token },
      });
      if (response.data?.success) {
        const nextUser = normaliseUserProfile(response.data.user || response.data.data || null);
        setUser(nextUser);

        if (typeof window !== "undefined") {
          ["local", "session"].forEach((type) => {
            const storage = getStorageByType(type);
            if (!storage) return;
            const raw = storage.getItem(AUTH_KEY);
            if (!raw) return;
            try {
              const parsed = JSON.parse(raw);
              storage.setItem(
                AUTH_KEY,
                JSON.stringify({
                  ...parsed,
                  token: parsed.token || token,
                  role: parsed.role || role,
                  branchId: parsed.branchId || branchId,
                  user: nextUser,
                })
              );
            } catch (error) {
              console.warn("Failed to update stored auth", error);
            }
          });
        }
      }
      setProfileLoaded(true);
      return response.data;
    } catch (error) {
      console.warn("Failed to load profile", error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [token, profileLoading, role, branchId]);

  useEffect(() => {
    if (token && !profileLoaded) {
      fetchProfile();
    }
  }, [token, profileLoaded, fetchProfile]);

  const updateProfile = useCallback(
    async (payload = {}) => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await axios.put(`${apiBaseUrl}/api/user/profile`, payload, {
        headers: { token },
      });
      if (response.data?.success) {
        const nextUser = normaliseUserProfile(response.data.user);
        setUser(nextUser);
        setProfileLoaded(true);
        if (typeof window !== "undefined") {
          ["local", "session"].forEach((type) => {
            const storage = getStorageByType(type);
            if (!storage) return;
            const raw = storage.getItem(AUTH_KEY);
            if (!raw) return;
            try {
              const parsed = JSON.parse(raw);
              storage.setItem(
                AUTH_KEY,
                JSON.stringify({
                  ...parsed,
                  user: nextUser,
                })
              );
            } catch (error) {
              console.warn("Failed to persist profile", error);
            }
          });
        }
      }
      return response.data;
    },
    [token]
  );

  const contextValue = useMemo(
    () => ({
      token,
      role,
      branchId,
      user,
      profileLoading,
      persistAuth,
      clearAuth,
      refreshProfile: fetchProfile,
      updateProfile,
      authStorage,
    }),
    [token, role, branchId, user, profileLoading, fetchProfile, updateProfile, authStorage]
  );

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;
