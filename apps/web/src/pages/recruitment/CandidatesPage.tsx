import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Card, EmptyState, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export function CandidatesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["candidates", search],
    queryFn: async () => (await api.get("/recruitment/candidates", { params: search ? { search } : {} })).data.data as Candidate[],
  });

  const createMut = useMutation({
    mutationFn: () => api.post("/recruitment/candidates", {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["candidates"] }); setShowCreate(false); setForm({ firstName: "", lastName: "", email: "", phone: "" }); },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const candidates = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Candidates"
        subtitle={`${candidates.length} candidate(s)`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => { setError(""); setShowCreate(true); }} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              <Plus size={14} /> Add Candidate
            </button>
          </div>
        }
      />
      {candidates.length === 0 ? (
        <EmptyState message="No candidates found." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.firstName} {c.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {showCreate && (
        <Modal title="Add Candidate" onClose={() => setShowCreate(false)}>
          {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name">
                <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </Field>
              <Field label="Last Name">
                <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </Field>
            </div>
            <Field label="Email">
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.firstName || !form.lastName || !form.email || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
