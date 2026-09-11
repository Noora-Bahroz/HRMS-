import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Badge, Card, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";

interface RecruitmentReports {
  applicationsByStatus: Record<string, number>;
  requisitionsByStatus: { status: string; count: number }[];
  requisitionStats: { id: string; title: string; status: string; openings: number; totalApplications: number }[];
  avgDaysToHire: number;
  totalApplications: number;
}

export function RecruitmentReportsPage() {
  const reportQuery = useQuery({
    queryKey: ["recruitment-reports"],
    queryFn: async () => (await api.get("/recruitment/reports")).data.data as RecruitmentReports,
  });

  if (reportQuery.isLoading) return <Spinner />;
  if (reportQuery.isError) return <ErrorState message={(reportQuery.error as Error).message} />;

  const r = reportQuery.data!;
  const appTotal = Object.values(r.applicationsByStatus).reduce((a, b) => a + b, 0);

  return (
    <div>
      <PageHeader title="Recruitment Reports" subtitle="Pipeline analytics and conversion metrics" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-gray-500">Total Applications</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{r.totalApplications}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">Avg. Days to Hire</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{r.avgDaysToHire} days</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">Requisitions</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{r.requisitionStats.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">Hired</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{r.applicationsByStatus["hired"] ?? 0}</div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Applications by Stage</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(r.applicationsByStatus).map(([status, count]) => {
              const pct = appTotal > 0 ? Math.round((count / appTotal) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-24 text-xs capitalize text-gray-500">{status}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-neutral-800">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs font-medium text-gray-700">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Requisitions by Status</h3>
          </div>
          <div className="space-y-3">
            {r.requisitionsByStatus.map((rs) => (
              <div key={rs.status} className="flex items-center justify-between">
                <Badge tone={statusTone(rs.status)}>{rs.status}</Badge>
                <span className="text-sm font-medium text-gray-700">{rs.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Requisition Details</h3>
          </div>
          {r.requisitionStats.length === 0 ? (
            <p className="text-xs text-gray-400">No requisitions yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Openings</th>
                  <th className="px-4 py-3 font-medium">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {r.requisitionStats.map((rs) => (
                  <tr key={rs.id}>
                    <td className="px-4 py-3 font-medium text-gray-800">{rs.title}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(rs.status)}>{rs.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{rs.openings}</td>
                    <td className="px-4 py-3 text-gray-500">{rs.totalApplications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
