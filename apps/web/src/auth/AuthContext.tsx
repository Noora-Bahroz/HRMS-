import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { api, clearTokens, getAccessToken, setTokens } from "../api/client";
import { fetchMe, loginRequest, signupRequest, Me } from "./auth";

interface AuthContextValue {
  me: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setMe)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    setTokens(result.accessToken, result.refreshToken);
    try {
      setMe(await fetchMe());
    } catch {
      setMe(result.user);
    }
  }, []);

  const signup = useCallback(async (fullName: string, email: string, password: string) => {
    const result = await signupRequest(fullName, email, password);
    setTokens(result.accessToken, result.refreshToken);
    try {
      setMe(await fetchMe());
    } catch {
      setMe(result.user);
    }
  }, []);

  const logout = useCallback(() => {
    const refresh = localStorage.getItem("hrms_refresh_token");
    if (refresh) void api.post("/auth/logout", { refreshToken: refresh }).catch(() => {});
    clearTokens();
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ me, loading, login, signup, logout }),
    [me, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
