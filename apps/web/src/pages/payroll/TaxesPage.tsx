import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";
import { TaxConfig, money } from "./types";

interface SlabDraft { fromAmount: string; toAmount: string; ratePercent: string }

export function TaxesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ country: "", taxType: "" });
  const [slabs, setSlabs] = useState<SlabDraft[]>([{ fromAmount: "", toAmount: "", ratePercent: "" }]);
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["payroll-taxes"],
    queryFn: async () => (await api.get("/payroll/taxes")).data.data as TaxConfig[],
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.post("/payroll/taxes", {
        country: form.country,
        taxType: form.taxType,
        slabs: slabs
          .filter((s) => s.fromAmount !== "" && s.ratePercent !== "")
          .map((s) => ({ fromAmount: Number(s.fromAmount), toAmount: s.toAmount !== "" ? Number(s.toAmount) : undefined, ratePercent: Number(s.ratePercent) })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-taxes"] });
      setShowCreate(false);
      setForm({ country: "", taxType: "" });
      setSlabs([{ fromAmount: "", toAmount: "", ratePercent: "" }]);
    },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const taxes = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Deductions & Taxes"
        subtitle="Tax configurations and progressive slabs"
        actions={
          <button
            onClick={() => { setError(""); setShowCreate(true); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Add Tax Config
          </button>
        }
      />
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      {taxes.length === 0 ? (
        <EmptyState message="No tax configurations yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {taxes.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">{t.country}</div>
                <Badge tone="blue">{t.taxType}</Badge>
              </div>
              <div className="mt-3 divide-y divide-gray-100 dark:divide-neutral-800">
                {t.slabs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="text-gray-600">
                      {money(s.fromAmount)} — {s.toAmount !== null ? money(s.toAmount) : "Above"}
                    </span>
                    <span className="font-medium text-gray-700">{Number(s.ratePercent)}%</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {showCreate && (
        <Modal title="Add Tax Configuration" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Field label="Country">
                <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. US" />
              </Field>
              <Field label="Tax Type">
                <input className="input" value={form.taxType} onChange={(e) => setForm({ ...form, taxType: e.target.value })} placeholder="e.g. progressive" />
              </Field>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Slabs</span>
                <button
                  onClick={() => setSlabs([...slabs, { fromAmount: "", toAmount: "", ratePercent: "" }])}
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  + Add slab
                </button>
              </div>
              {slabs.map((s, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input className="input w-24" type="number" placeholder="From" value={s.fromAmount} onChange={(e) => setSlabs(slabs.map((x, xi) => (xi === i ? { ...x, fromAmount: e.target.value } : x)))} />
                  <input className="input w-24" type="number" placeholder="To" value={s.toAmount} onChange={(e) => setSlabs(slabs.map((x, xi) => (xi === i ? { ...x, toAmount: e.target.value } : x)))} />
                  <input className="input w-24" type="number" placeholder="Rate %" value={s.ratePercent} onChange={(e) => setSlabs(slabs.map((x, xi) => (xi === i ? { ...x, ratePercent: e.target.value } : x)))} />
                  <button onClick={() => setSlabs(slabs.filter((_, xi) => xi !== i))} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-neutral-800">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => createMut.mutate()} disabled={!form.country || !form.taxType || createMut.isPending} className="btn-primary">
                {createMut.isPending ? "Creating..." : "Add Config"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}