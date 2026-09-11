import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";

interface Posting {
  id: string;
  title: string;
  location: string | null;
  postedDate: string;
  dueDate: string | null;
  isActive: boolean;
  requisition: { tenantId: string; title: string };
  _count: { applications: number };
}

interface RequisitionOption { id: string; title: string; }

export function PostingsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ requisitionId: "", title: "", location: "" });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["postings"],
    queryFn: async () => (await api.get("/recruitment/postings")).data.data as Posting[],
  });

  const reqsQuery = useQuery({
    queryKey: ["requisitions-list"],
    queryFn: async () => (await api.get("/recruitment/requisitions")).data.data as RequisitionOption[],
  });

  const createMut = useMutation({
    mutationFn: () => api.post("/recruitment/postings", { requisitionId: form.requisitionId, title: form.title, location: form.location || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["postings"] }); setShowCreate(false); setForm({ requisitionId: "", title: "", location: "" }); },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const postings = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Job Postings"
        subtitle={`${postings.length} active posting(s)`}
        actions={
          <button onClick={() => { setError(""); setShowCreate(true); }} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={14} /> New Posting
          </button>
        }
      />
      {postings.length === 0 ? (
        <EmptyState message="No active postings yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {postings.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{p.title}</div>
                  <div className="mt-1 text-xs text-gray-500">{p.requisition.title} · {p._count.applications} application(s)</div>
                </div>
                <Badge tone={p.isActive ? "green" : "gray"}>{p.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              {p.location && <div className="mt-2 text-xs text-gray-400">{p.location}</div>}
              <div className="mt-2 text-[11px] text-gray-400">
                Posted {new Date(p.postedDate).toLocaleDateString()}
                {p.dueDate ? ` · Due ${new Date(p.dueDate).toLocaleDateString()}` : ""}
              </div>
            </Card>
          ))}
        </div>
      )}
      {showCreate && (
        <Modal title="New Posting" onClose={() => setShowCreate(false)}>
          {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <div className="space-y-3">
            <Field label="Requisition">
              <select className="input" value={form.requisitionId} onChange={(e) => setForm({ ...form, requisitionId: e.target.value })}>
                <option value="">Select requisition</option>
                {(reqsQuery.data ?? []).map((r: RequisitionOption) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Posting Title">
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Engineer - Remote" />
            </Field>
            <Field label="Location">
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Remote, New York" />
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.requisitionId || !form.title || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
