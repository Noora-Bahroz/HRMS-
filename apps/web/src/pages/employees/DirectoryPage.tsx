import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Mail, Phone, Search } from "lucide-react";
import { api } from "../../api/client";
import { PageHeader, Card, Spinner, ErrorState, EmptyState } from "../../components/ui/ui";

interface DirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  employeeNumber: string;
  departmentId: string | null;
  designationId: string | null;
}

const initials = (f: string, l: string) => `${(f || "?").charAt(0)}${(l || "").charAt(0)}`;

export function DirectoryPage() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["directory"],
    queryFn: async () =>
      (await api.get<{ data: DirectoryEntry[] }>("/employees/directory")).data.data,
  });

  const rows = (query.data ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.employeeNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Employee Directory"
        subtitle="Browse all active employees."
        actions={
          <Link to="/employees" className="btn-secondary">
            Employee List
          </Link>
        }
      />

      <Card className="mb-4 overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-neutral-800">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {query.isLoading ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} />
      ) : rows.length === 0 ? (
        <EmptyState message="No employees found in the directory." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <Link
              key={p.id}
              to={`/employees/${p.id}`}
              className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {initials(p.firstName, p.lastName)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-800 dark:text-neutral-100">
                  {p.firstName} {p.lastName}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400">
                  <Mail size={12} /> <span className="truncate">{p.email}</span>
                </div>
                {p.phone && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-neutral-500">
                    <Phone size={12} /> {p.phone}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
