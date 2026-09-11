import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { PageHeader, Card, Spinner, ErrorState, EmptyState } from "../../components/ui/ui";

interface Department {
  id: string;
  name: string;
  code: string | null;
}
interface Team {
  id: string;
  name: string;
  departmentId: string;
}
interface OrgTree {
  companies: { id: string; name: string }[];
  departments: (Department & { teams: Team[] })[];
}

export function OrganizationPage() {
  const query = useQuery({
    queryKey: ["org-tree"],
    queryFn: async () => (await api.get("/organization/tree")).data.data as OrgTree,
  });

  return (
    <div>
      <PageHeader title="Organization" subtitle="Companies, departments, and teams." />

      {query.isLoading ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} />
      ) : (
        <OrgTreeView data={query.data} />
      )}
    </div>
  );
}

function OrgTreeView({ data }: { data: OrgTree | undefined }) {
  const companies = data?.companies ?? [];
  const departments = data?.departments ?? [];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Companies</h3>
        {companies.length ? (
          <ul className="space-y-2">
            {companies.map((c) => (
              <li key={c.id} className="rounded-md border border-gray-100 p-3 text-sm text-gray-700">
                {c.name}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No companies." />
        )}
      </Card>

      <Card className="p-4 lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Departments & Teams</h3>
        {departments.length ? (
          <div className="space-y-3">
            {departments.map((d) => (
              <div key={d.id} className="rounded-md border border-gray-100 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{d.name}</span>
                  {d.code && <span className="text-xs text-gray-400">({d.code})</span>}
                </div>
                {d.teams?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {d.teams.map((t) => (
                      <span key={t.id} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">
                        {t.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">No teams</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No departments." />
        )}
      </Card>
    </div>
  );
}
