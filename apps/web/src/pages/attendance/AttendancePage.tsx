import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
import { api, extractError } from "../../api/client";
import { PageHeader, Card, Badge, statusTone, EmptyState, ErrorState } from "../../components/ui/ui";
import { useState } from "react";

interface AttendanceRecord {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: string;
  totalHours: number | null;
}

export function AttendancePage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const query = useQuery({
    queryKey: ["my-attendance"],
    queryFn: async () => (await api.get("/attendance/mine")).data.data as AttendanceRecord[],
  });

  const checkInMutation = useMutation({
    mutationFn: async () => (await api.post("/attendance/check-in", {})).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      setError("");
    },
    onError: (err) => setError(extractError(err)),
  });
  const checkOutMutation = useMutation({
    mutationFn: async () => (await api.post("/attendance/check-out", {})).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      setError("");
    },
    onError: (err) => setError(extractError(err)),
  });

  const today = query.data?.[0];
  const isCheckedIn = !!today?.checkInAt && !today?.checkOutAt;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Check in and out, view your time history." />
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">Today</h3>
          {isCheckedIn ? (
            <button className="btn-primary w-full" onClick={() => checkOutMutation.mutate()}>
              <LogOut size={16} /> Check Out
            </button>
          ) : (
            <button className="btn-primary w-full" onClick={() => checkInMutation.mutate()}>
              <LogIn size={16} /> Check In
            </button>
          )}
          {today?.checkInAt && (
            <p className="mt-3 text-center text-xs text-gray-500">
              Checked in at {new Date(today.checkInAt).toLocaleTimeString()}
            </p>
          )}
          {today && (
            <p className="mt-1 text-center text-xs text-gray-500">
              Hours: {today.totalHours ?? "—"}
            </p>
          )}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">History</h3>
          {query.isError ? (
            <ErrorState message={(query.error as Error).message} />
          ) : query.data?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Check In</th>
                  <th className="pb-2">Check Out</th>
                  <th className="pb-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {query.data.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2.5 text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-2.5">
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="py-2.5 text-gray-600">{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : "—"}</td>
                    <td className="py-2.5 text-gray-600">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : "—"}</td>
                    <td className="py-2.5 text-gray-600">{r.totalHours ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No attendance records yet." />
          )}
        </Card>
      </div>
    </div>
  );
}
