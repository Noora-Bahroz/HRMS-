import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "../../api/client";
import {
  PageHeader,
  Card,
  Spinner,
  ErrorState,
  EmptyState,
  Badge,
  statusTone,
  Pagination,
} from "../../components/ui/ui";
import { EmployeeFormModal } from "./EmployeeFormModal";

interface EmployeeRow {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  employmentStatus: string;
  employmentType: string | null;
  dateOfJoining: string | null;
}

interface ListResponse {
  success: boolean;
  data: EmployeeRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const query = useQuery({
    queryKey: ["employees", page, search],
    queryFn: async () =>
      (
        await api.get<ListResponse>("/employees", {
          params: { page, limit: 10, search: search || undefined },
        })
      ).data,
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage employee profiles, employment details, and documents."
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Employee
          </button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3">
          <input
            className="input max-w-xs"
            placeholder="Search name, email, employee no..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorState message={(query.error as Error).message} />
        ) : (query.data?.data ?? []).length === 0 ? (
          <EmptyState message="No employees found." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">No.</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Joining</th>
              </tr>
            </thead>
            <tbody>
              {(query.data?.data ?? []).map((e) => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/employees/${e.id}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-brand-400">
                      {e.firstName} {e.lastName}
                    </Link>
                    <div className="text-xs text-gray-400">{e.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.employeeNumber}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(e.employmentStatus)}>{e.employmentStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.employmentType ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {query.data && (
          <div className="px-4 py-3">
            <Pagination
              page={query.data.meta.page}
              totalPages={query.data.meta.totalPages}
              onPage={setPage}
            />
          </div>
        )}
      </Card>

      {showForm && <EmployeeFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}
