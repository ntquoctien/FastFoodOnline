import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const AUTH_KEY = "adminAuth";

const StoreContextProvider = (props) => {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [branchId, setBranchId] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setToken(parsed.token || "");
        setRole(parsed.role || "");
        setBranchId(parsed.branchId || "");
      }
    } catch (error) {
      console.warn("Failed to parse stored auth", error);
    }
  }, []);

  const persistAuth = ({ token: nextToken, role: nextRole, branchId: nextBranchId }) => {
    const payload = {
      token: nextToken || "",
      role: nextRole || "",
      branchId: nextBranchId || "",
    };
    setToken(payload.token);
    setRole(payload.role);
    setBranchId(payload.branchId);
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  };

  const clearAuth = () => {
    setToken("");
    setRole("");
    setBranchId("");
    localStorage.removeItem(AUTH_KEY);
  };

  const contextValue = {
    token,
    role,
    branchId,
    persistAuth,
    clearAuth,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;
