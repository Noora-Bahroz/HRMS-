import axios, { AxiosError } from "axios";

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown[] };
}

const baseURL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "hrms_access_token";
const REFRESH_KEY = "hrms_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    const refresh = localStorage.getItem(REFRESH_KEY);

    if (error.response?.status === 401 && original && refresh && !original._retried) {
      original._retried = true;
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: refresh });
        setTokens(data.data.accessToken, data.data.refreshToken);
        return api(original);
      } catch {
        clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

export function extractError(err: unknown): string {
  if (axios.isAxiosError<ApiError>(err)) {
    return err.response?.data?.error?.message ?? err.message;
  }
  return err instanceof Error ? err.message : "Unknown error";
}
