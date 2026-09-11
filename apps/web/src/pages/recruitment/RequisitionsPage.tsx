import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";

interface Requisition {
  id: string;
  title: string;
  status: string;
  openings: number;
  description: string | null;
  departmentId: string | null;
  createdAt: string;
  _count: { postings: number };
}

export function RequisitionsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", openings: 1, description: "" });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["requisitions"],
    queryFn: async () => (await api.get("/recruitment/requisitions")).data.data as Requisition[],
  });

  const createMut = useMutation({
    mutationFn: () => api.post("/recruitment/requisitions", { title: form.title, openings: form.openings, description: form.description || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["requisitions"] }); setShowCreate(false); setForm({ title: "", openings: 1, description: "" }); },
    onError: (e: any) => setError(extractError(e)),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/recruitment/requisitions/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requisitions"] }),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const requisitions = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Job Requisitions"
        subtitle={`${requisitions.length} total requisition(s)`}
        actions={
          <button onClick={() => { setError(""); setShowCreate(true); }} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={14} /> New Requisition
          </button>
        }
      />
      {requisitions.length === 0 ? (
        <EmptyState message="No requisitions yet. Create one to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requisitions.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{r.title}</div>
                  <div className="mt-1 text-xs text-gray-500">{r.openings} opening(s) · {r._count.postings} posting(s)</div>
                </div>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>
              {r.description && <p className="mt-2 text-xs text-gray-400 line-clamp-2">{r.description}</p>}
              <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3 dark:border-neutral-800">
                {r.status === "draft" && (
                  <button onClick={() => updateStatusMut.mutate({ id: r.id, status: "open" })} className="rounded-md bg-green-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-green-700">
                    Open
                  </button>
                )}
                {r.status === "open" && (
                  <button onClick={() => updateStatusMut.mutate({ id: r.id, status: "closed" })} className="rounded-md bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-neutral-200">
                    Close
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {showCreate && (
        <Modal title="New Requisition" onClose={() => setShowCreate(false)}>
          {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <div className="space-y-3">
            <Field label="Title">
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Engineer" />
            </Field>
            <Field label="Openings">
              <input className="input" type="number" min={1} value={form.openings} onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })} />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.title || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
