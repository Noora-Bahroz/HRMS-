import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Plus, ShieldCheck, X } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../auth/auth";
import {
  PageHeader,
  Card,
  Spinner,
  ErrorState,
  EmptyState,
} from "../../components/ui/ui";

interface Permission {
  id: string;
  code: string;
  module: string;
  description?: string | null;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  rolePermissions?: { permission: Permission }[];
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  employee: "Employees",
  org: "Organization",
  leave: "Leave",
  attendance: "Attendance",
  payroll: "Payroll",
  expense: "Expenses",
  asset: "Assets",
  ats: "Recruitment",
  role: "Roles",
  user: "Users",
  report: "Reports",
  audit: "Audit",
};

function moduleLabel(m: string) {
  return MODULE_LABELS[m] ?? m.charAt(0).toUpperCase() + m.slice(1);
}

export function RolesPage() {
  const { me } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errMessage, setErrMessage] = useState<string | null>(null);

  const canManage = hasPermission(me, "role:manage");

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get<{ data: Role[] }>("/roles")).data.data,
  });

  const permsQuery = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => (await api.get<{ data: Permission[] }>("/roles/permissions")).data.data,
  });

  const roles = rolesQuery.data ?? [];
  const permissions = permsQuery.data ?? [];
  const selectedRole = roles.find((r) => r.id === selectedId) ?? null;

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      const arr = map.get(p.module) ?? [];
      arr.push(p);
      map.set(p.module, arr);
    }
    return Array.from(map.entries()).map(([module, items]) => ({
      module,
      items: items.sort((a, b) => a.code.localeCompare(b.code)),
    }));
  }, [permissions]);

  const openRole = (role: Role) => {
    setSelectedId(role.id);
    setSelected(new Set((role.rolePermissions ?? []).map((rp) => rp.permission.code)));
    setDirty(false);
    setMessage(null);
    setErrMessage(null);
  };

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (codes: string[]) => {
      const { data } = await api.patch(`/roles/${selectedId}/permissions`, { permissionCodes: codes });
      return data.data as Role;
    },
    onSuccess: (updated) => {
      qc.setQueryData<Role[]>(["roles"], (prev) =>
        (prev ?? []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      );
      setDirty(false);
      setMessage("Role permissions saved.");
      setErrMessage(null);
    },
    onError: (e) => {
      const msg = (e as Error).message || "Failed to save permissions.";
      setErrMessage(msg);
      setMessage(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/roles", {
        name: newName,
        description: newDesc || undefined,
        permissionCodes: [],
      });
      return data.data as Role;
    },
    onSuccess: (role) => {
      qc.setQueryData<Role[]>(["roles"], (prev) => [...(prev ?? []), role]);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      openRole(role);
      setMessage(`Role "${role.name}" created.`);
    },
    onError: (e) => {
      setErrMessage((e as Error).message || "Failed to create role.");
    },
  });

  if (!canManage) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 p-16 text-center">
        <div className="text-sm font-medium text-gray-700">Access denied</div>
        <p className="max-w-md text-xs text-gray-400">
          You do not have permission to manage roles and permissions.
        </p>
      </div>
    );
  }

  if (rolesQuery.isLoading || permsQuery.isLoading) return <Spinner />;
  if (rolesQuery.isError) return <ErrorState message={(rolesQuery.error as Error).message} />;
  if (permsQuery.isError) return <ErrorState message={(permsQuery.error as Error).message} />;

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage roles and grant granular permissions."
        actions={
          <button
            className="btn-primary inline-flex items-center gap-1.5"
            onClick={() => {
              setShowCreate(true);
              setMessage(null);
              setErrMessage(null);
            }}
          >
            <Plus size={16} /> New Role
          </button>
        }
      />

      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <Check size={16} /> {message}
        </div>
      )}
      {errMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <X size={16} /> {errMessage}
        </div>
      )}

      {showCreate && (
        <Card className="mb-4 p-4">
          <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-neutral-100">
            Create custom role
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[200px] flex-1">
              <input
                className="input"
                placeholder="Role name (e.g. Finance Analyst)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <input
                className="input"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
            {roles.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-gray-400">No roles.</li>
            )}
            {roles.map((r) => {
              const active = r.id === selectedId;
              return (
                <li key={r.id}>
                  <button
                    className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                      active
                        ? "bg-brand-50 dark:bg-brand-900/30"
                        : "hover:bg-gray-50 dark:hover:bg-neutral-800/60"
                    }`}
                    onClick={() => openRole(r)}
                  >
                    <span>
                      <span className="block text-sm font-medium text-gray-800 dark:text-neutral-100">
                        {r.name}
                        {r.isSystem && (
                          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
                            system
                          </span>
                        )}
                      </span>
                      {r.description && (
                        <span className="block truncate text-xs text-gray-400">{r.description}</span>
                      )}
                    </span>
                    <ChevronRight
                      size={16}
                      className={`shrink-0 text-gray-300 ${active ? "text-brand-500" : ""}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selectedRole ? (
          <div>
            <Card className="mb-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-neutral-100">
                      {selectedRole.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-neutral-400">
                      {selectedRole.description || "No description"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {selected.size} / {permissions.length} permissions
                  </span>
                  <button
                    className="btn-primary"
                    disabled={!dirty || saveMutation.isPending}
                    onClick={() => saveMutation.mutate(Array.from(selected))}
                  >
                    {saveMutation.isPending ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {grouped.map(({ module, items }) => {
                const onCount = items.filter((i) => selected.has(i.code)).length;
                const allOn = onCount === items.length;
                const noneOn = onCount === 0;
                return (
                  <Card key={module} className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
                      <div className="text-sm font-semibold text-gray-700 dark:text-neutral-200">
                        {moduleLabel(module)}
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {onCount}/{items.length}
                        </span>
                      </div>
                      <button
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        onClick={() => {
                          const next = new Set(selected);
                          for (const i of items) {
                            if (allOn) next.delete(i.code);
                            else next.add(i.code);
                          }
                          setSelected(next);
                          setDirty(true);
                        }}
                      >
                        {allOn ? "Clear all" : noneOn ? "Select all" : "Select all"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2">
                      {items.map((p) => {
                        const on = selected.has(p.code);
                        return (
                          <label
                            key={p.code}
                            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                              on
                                ? "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
                                : "border-gray-200 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 accent-brand-600"
                              checked={on}
                              onChange={() => toggle(p.code)}
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-gray-800 dark:text-neutral-100">
                                {p.code}
                              </span>
                              {p.description && (
                                <span className="block text-xs text-gray-400">{p.description}</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="p-16">
            <EmptyState message="Select a role from the list to view and edit its permissions." />
          </Card>
        )}
      </div>
    </div>
  );
}
