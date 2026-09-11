import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "../../api/client";
import { PageHeader, Card, Badge, statusTone, EmptyState, Spinner } from "../../components/ui/ui";

interface LeaveType {
  id: string;
  name: string;
  code: string;
}
interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  leaveType: { name: string; code: string };
}
interface LeaveBalance {
  id: string;
  entitled: number;
  used: number;
  available: number;
  leaveType: { name: string };
}

export function LeavePage() {
  const queryClient = useQueryClient();
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const typesQuery = useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => (await api.get("/leave/types")).data.data as LeaveType[],
  });
  const requestsQuery = useQuery({
    queryKey: ["my-leave"],
    queryFn: async () => (await api.get("/leave/requests/mine")).data.data as LeaveRequest[],
  });
  const balancesQuery = useQuery({
    queryKey: ["my-balances"],
    queryFn: async () => (await api.get("/leave/balances/mine")).data.data as LeaveBalance[],
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: unknown) => (await api.post("/leave/requests", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leave"] });
      queryClient.invalidateQueries({ queryKey: ["my-balances"] });
      setStartDate(""); setEndDate(""); setDays(""); setReason(""); setError("");
    },
    onError: (err) => setError(extractError(err)),
  });

  function submit() {
    applyMutation.mutate({
      leaveTypeId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      days: Number(days),
      reason: reason || undefined,
    });
  }

  return (
    <div>
      <PageHeader title="Leave" subtitle="Request time off and track your balances." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">New Leave Request</h3>
          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="label">Leave type</label>
              <select className="input" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} required>
                <option value="">Select type</option>
                {(typesQuery.data ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start</label>
                <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="label">End</label>
                <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Days</label>
              <input className="input" type="number" min="0.5" step="0.5" value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
            <div>
              <label className="label">Reason</label>
              <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <button className="btn-primary w-full" disabled={applyMutation.isPending} onClick={submit}>
              {applyMutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">My Balances</h3>
          {balancesQuery.data?.length ? (
            <ul className="space-y-3">
              {balancesQuery.data.map((b) => (
                <li key={b.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{b.leaveType.name}</div>
                    <div className="text-xs text-gray-400">
                      Used {String(b.used)} / Entitled {String(b.entitled)}
                    </div>
                  </div>
                  <Badge tone="blue">{String(b.available)} left</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No balances assigned." />
          )}
        </Card>

        <Card className="p-4 lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">My Requests</h3>
          {requestsQuery.isLoading ? (
            <Spinner label="" />
          ) : requestsQuery.data?.length ? (
            <ul className="space-y-3">
              {requestsQuery.data.map((r) => (
                <li key={r.id} className="rounded-md border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{r.leaveType.name}</span>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()} · {r.days} day(s)
                  </div>
                  {r.reason && <p className="mt-1 text-xs text-gray-400">{r.reason}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No leave requests yet." />
          )}
        </Card>
      </div>
    </div>
  );
}
