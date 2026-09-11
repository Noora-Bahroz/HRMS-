import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowRightLeft } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";

interface Offer {
  id: string;
  salary: number | null;
  startDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  application: {
    id: string;
    candidate: { firstName: string; lastName: string; email: string };
    jobPosting: { title: string; requisition: { title: string } };
  };
}

interface ApplicationOption { id: string; candidate: { firstName: string; lastName: string }; jobPosting: { title: string } }

export function OffersPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showConvert, setShowConvert] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState({ departmentId: "", teamId: "", designationId: "" });
  const [form, setForm] = useState({ applicationId: "", salary: "", startDate: "", notes: "" });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["offers"],
    queryFn: async () => (await api.get("/recruitment/offers")).data.data as Offer[],
  });

  const appsQuery = useQuery({
    queryKey: ["applications-for-offer"],
    queryFn: async () => (await api.get("/recruitment/applications")).data.data as ApplicationOption[],
  });

  const createMut = useMutation({
    mutationFn: () => api.post("/recruitment/offers", {
      applicationId: form.applicationId,
      salary: form.salary ? Number(form.salary) : undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); setShowCreate(false); setForm({ applicationId: "", salary: "", startDate: "", notes: "" }); },
    onError: (e: any) => setError(extractError(e)),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/recruitment/offers/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });

  const convertMut = useMutation({
    mutationFn: () => api.post(`/recruitment/offers/${showConvert}/convert`, {
      departmentId: convertForm.departmentId || undefined,
      teamId: convertForm.teamId || undefined,
      designationId: convertForm.designationId || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); setShowConvert(null); setConvertForm({ departmentId: "", teamId: "", designationId: "" }); },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const offers = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Offers"
        subtitle={`${offers.length} offer(s)`}
        actions={
          <button onClick={() => { setError(""); setShowCreate(true); }} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={14} /> Create Offer
          </button>
        }
      />
      {offers.length === 0 ? (
        <EmptyState message="No offers created yet." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Salary</th>
                <th className="px-4 py-3 font-medium">Start Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {offers.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{o.application.candidate.firstName} {o.application.candidate.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{o.application.jobPosting.title}</td>
                  <td className="px-4 py-3 text-gray-500">{o.salary ? `$${o.salary.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{o.startDate ? new Date(o.startDate).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {o.status === "pending" && (
                        <>
                          <button onClick={() => updateStatusMut.mutate({ id: o.id, status: "accepted" })} className="text-[11px] font-medium text-green-600 hover:text-green-700">Accept</button>
                          <button onClick={() => updateStatusMut.mutate({ id: o.id, status: "rejected" })} className="text-[11px] font-medium text-red-600 hover:text-red-700">Reject</button>
                        </>
                      )}
                      {o.status === "accepted" && (
                        <button onClick={() => { setError(""); setShowConvert(o.id); }} className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700">
                          <ArrowRightLeft size={10} /> Convert to Employee
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {showCreate && (
        <Modal title="Create Offer" onClose={() => setShowCreate(false)}>
          {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <div className="space-y-3">
            <Field label="Application">
              <select className="input" value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })}>
                <option value="">Select application</option>
                {(appsQuery.data ?? []).map((a: ApplicationOption) => (
                  <option key={a.id} value={a.id}>{a.candidate.firstName} {a.candidate.lastName} — {a.jobPosting.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Salary">
              <input className="input" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="e.g. 95000" />
            </Field>
            <Field label="Start Date">
              <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="Notes">
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.applicationId || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Creating..." : "Create Offer"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showConvert && (
        <Modal title="Convert to Employee" onClose={() => setShowConvert(null)}>
          {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <p className="mb-3 text-xs text-gray-500">This will create an employee record from the candidate profile and mark the application as hired.</p>
          <div className="space-y-3">
            <Field label="Department ID (optional)">
              <input className="input" value={convertForm.departmentId} onChange={(e) => setConvertForm({ ...convertForm, departmentId: e.target.value })} placeholder="UUID" />
            </Field>
            <Field label="Team ID (optional)">
              <input className="input" value={convertForm.teamId} onChange={(e) => setConvertForm({ ...convertForm, teamId: e.target.value })} placeholder="UUID" />
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConvert(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => convertMut.mutate()} disabled={convertMut.isPending} className="btn-primary">
                {convertMut.isPending ? "Converting..." : "Convert"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
