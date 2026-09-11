import { api } from "../api/client";

export interface Me {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  scope?: string;
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data.data as { accessToken: string; refreshToken: string; user: Me };
}

export async function signupRequest(fullName: string, email: string, password: string) {
  const { data } = await api.post("/auth/signup", { fullName, email, password });
  return data.data as { accessToken: string; refreshToken: string; user: Me };
}

export async function fetchMe(): Promise<Me> {
  const { data } = await api.get("/auth/me");
  return data.data;
}

export function hasPermission(me: Me | null, permission: string): boolean {
  if (!me) return false;
  const permissions = me.permissions ?? [];
  if (me.isSuperAdmin || permissions.includes("*")) return true;
  return permissions.includes(permission);
}
