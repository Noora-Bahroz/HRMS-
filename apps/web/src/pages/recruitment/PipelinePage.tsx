import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";

interface Application {
  id: string;
  status: string;
  stage: number;
  appliedAt: string;
  candidate: { id: string; firstName: string; lastName: string; email: string };
  jobPosting: { title: string; requisition: { title: string } };
  interviews: { id: string; scheduledAt: string; status: string }[];
  offer: { id: string; status: string; salary: number | null } | null;
}

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];

export function PipelinePage() {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api.get("/recruitment/applications")).data.data as Application[],
  });

  const moveMut = useMutation({
    mutationFn: ({ id, status, stage }: { id: string; status: string; stage: number }) =>
      api.patch(`/recruitment/applications/${id}/move`, { status, stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const apps = listQuery.data!;
  const grouped = STAGES.reduce((acc, s) => { acc[s] = apps.filter((a) => a.status === s); return acc; }, {} as Record<string, Application[]>);

  const advanceStage = (app: Application) => {
    const idx = STAGES.indexOf(app.status);
    if (idx < 0 || idx >= STAGES.length - 2) return;
    const next = STAGES[idx + 1];
    moveMut.mutate({ id: app.id, status: next, stage: idx + 2 });
  };

  return (
    <div>
      <PageHeader title="Application Pipeline" subtitle={`${apps.length} application(s) across ${STAGES.length} stages`} />
      {apps.length === 0 ? (
        <EmptyState message="No applications yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((stage) => (
            <div key={stage}>
              <div className="mb-2 text-xs font-semibold uppercase text-gray-500">{stage} <span className="text-gray-400">({(grouped[stage] ?? []).length})</span></div>
              <div className="space-y-3">
                {(grouped[stage] ?? []).map((app) => (
                  <Card key={app.id} className="p-3">
                    <div className="text-xs font-medium text-gray-800">{app.candidate.firstName} {app.candidate.lastName}</div>
                    <div className="mt-0.5 text-[11px] text-gray-400">{app.jobPosting.title}</div>
                    {app.offer && (
                      <div className="mt-1 text-[11px] text-gray-400">
                        Offer: {app.offer.salary ? `$${app.offer.salary.toLocaleString()}` : "—"} · <Badge tone={statusTone(app.offer.status)}>{app.offer.status}</Badge>
                      </div>
                    )}
                    {stage !== "hired" && stage !== "rejected" && (
                      <button
                        onClick={() => advanceStage(app)}
                        disabled={moveMut.isPending}
                        className="mt-2 inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-300"
                      >
                        Advance <ArrowRight size={10} />
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
