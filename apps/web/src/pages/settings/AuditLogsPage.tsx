import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { api, extractError } from "../../api/client";
import {
  PageHeader,
  Card,
  Spinner,
  ErrorState,
  Badge,
  Pagination,
} from "../../components/ui/ui";

interface AuditRow {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  ip?: string | null;
  createdAt: string;
  actor: { id: string; email: string; fullName: string } | null;
}

interface AuditResponse {
  total: number;
  rows: AuditRow[];
}

const PAGE_SIZE = 20;

export function AuditLogsPage() {
  const [page, setPage] = useState(1);

  const logsQuery = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: async () =>
      (await api.get<{ data: AuditResponse }>("/reports/audit-logs", { params: { page, limit: PAGE_SIZE } }))
        .data.data,
  });

  if (logsQuery.isLoading) return <Spinner />;
  if (logsQuery.isError) return <ErrorState message={extractError(logsQuery.error)} />;

  const logs = logsQuery.data?.rows ?? [];
  const total = logsQuery.data?.total ?? 0;

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="System-wide activity trail: who did what and when."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
            <ScrollText size={13} />
            {total} events
          </span>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Resource ID</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400">
                    No audit events recorded yet.
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {l.actor ? (
                      <div>
                        <div className="font-medium text-gray-800 dark:text-neutral-100">{l.actor.fullName}</div>
                        <div className="text-xs text-gray-400">{l.actor.email}</div>
                      </div>
                    ) : (
                      <Badge tone="gray">system</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={l.action.includes("delete") ? "red" : "blue"}>{l.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-neutral-300">{l.resource}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-gray-400">
                    {l.resourceId ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.ip ?? "—"}</td>
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