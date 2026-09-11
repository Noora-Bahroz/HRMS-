import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search, Plus, Trash2, X } from "lucide-react";
import { api, extractError } from "../../api/client";
import {
  PageHeader,
  Card,
  Spinner,
  ErrorState,
  Badge,
  Pagination,
} from "../../components/ui/ui";

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  status: string;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  userRoles: { role: { name: string } }[];
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
}

interface UsersResponse {
  rows: UserRow[];
  total: number;
}

const PAGE_SIZE = 10;

export function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", roleId: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [errMessage, setErrMessage] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users", page, search],
    queryFn: async () =>
      (await api.get<{ data: UsersResponse }>("/users", { params: { page, limit: PAGE_SIZE, search } }))
        .data.data,
  });

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get<{ data: Role[] }>("/roles")).data.data,
  });

  const users = usersQuery.data?.rows ?? [];
  const total = usersQuery.data?.total ?? 0;
  const roles = rolesQuery.data ?? [];

  const runSearch = (value: string) => {
    setSearch(value.trim());
    setPage(1);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/users", form);
      return data.data as UserRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setShowCreate(false);
      setForm({ fullName: "", email: "", password: "", roleId: "" });
      setMessage("User created.");
      setErrMessage(null);
    },
    onError: (e) => setErrMessage(extractError(e) || "Failed to create user."),
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { data } = await api.post(`/users/${userId}/roles`, { roleId });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setMessage("Role assigned.");
      setErrMessage(null);
    },
    onError: (e) => setErrMessage(extractError(e) || "Failed to assign role."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete(`/users/${userId}`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setMessage("User suspended.");
      setErrMessage(null);
    },
    onError: (e) => setErrMessage(extractError(e) || "Failed to suspend user."),
  });

  if (usersQuery.isLoading || rolesQuery.isLoading) return <Spinner />;
  if (usersQuery.isError) return <ErrorState message={extractError(usersQuery.error)} />;
  if (rolesQuery.isError) return <ErrorState message={extractError(rolesQuery.error)} />;

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Create user accounts and assign roles across the system."
        actions={
          <button
            className="btn-primary inline-flex items-center gap-1.5"
            onClick={() => {
              setShowCreate((s) => !s);
              setMessage(null);
              setErrMessage(null);
            }}
          >
            <Plus size={16} /> New User
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
          <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-neutral-100">Create user account</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input
              className="input"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <input
              className="input"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input"
              placeholder="Temporary password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <select
              className="input"
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              className="btn-primary"
              disabled={!form.fullName.trim() || !form.email.trim() || !form.password || !form.roleId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search users..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch(searchInput);
              }}
            />
          </div>
          <span className="text-xs text-gray-400">{total} users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Assign role</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-neutral-100">
                      {u.fullName}
                      {u.isSuperAdmin && <span className="ml-2 text-xs text-brand-600 dark:text-brand-400">Super Admin</span>}
                    </div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.status === "active" ? "green" : "red"}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.userRoles.map((r) => (
                        <span
                          key={r.role.name}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          {r.role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="input py-1 text-xs"
                      value=""
                      disabled={u.isSuperAdmin}
                      onChange={(e) => {
                        if (e.target.value) assignRoleMutation.mutate({ userId: u.id, roleId: e.target.value });
                      }}
                    >
                      <option value="">Assign role...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!u.isSuperAdmin && (
                      <button
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        title="Suspend user"
                        onClick={() => {
                          if (window.confirm(`Suspend ${u.fullName}?`)) deleteMutation.mutate(u.id);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-4 py-3 dark:border-neutral-800">
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPage={setPage} />
        </div>
      </Card>
    </div>
  );
}