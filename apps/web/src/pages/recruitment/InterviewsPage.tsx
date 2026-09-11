import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, extractError } from "../../api/client";
import { Badge, Card, EmptyState, PageHeader, Spinner, ErrorState, statusTone } from "../../components/ui/ui";
import { Modal, Field } from "../employees/components";

interface Interview {
  id: string;
  scheduledAt: string;
  mode: string | null;
  status: string;
  application: {
    id: string;
    candidate: { firstName: string; lastName: string; email: string };
    jobPosting: { title: string };
  };
  feedback: { id: string; rating: number | null; status: string | null; comment: string | null }[];
}

interface ApplicationOption { id: string; candidate: { firstName: string; lastName: string }; jobPosting: { title: string } }

function formatDT(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function InterviewsPage() {
  const qc = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [schedForm, setSchedForm] = useState({ applicationId: "", scheduledAt: "", mode: "video" });
  const [fbForm, setFbForm] = useState({ rating: 3, comment: "", status: "recommended" as string });
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => (await api.get("/recruitment/interviews")).data.data as Interview[],
  });

  const appsQuery = useQuery({
    queryKey: ["applications-for-interview"],
    queryFn: async () => (await api.get("/recruitment/applications")).data.data as ApplicationOption[],
  });

  const scheduleMut = useMutation({
    mutationFn: () => api.post("/recruitment/interviews", {
      applicationId: schedForm.applicationId,
      scheduledAt: new Date(schedForm.scheduledAt).toISOString(),
      mode: schedForm.mode,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["interviews"] }); setShowSchedule(false); setSchedForm({ applicationId: "", scheduledAt: "", mode: "video" }); },
    onError: (e: any) => setError(extractError(e)),
  });

  const feedbackMut = useMutation({
    mutationFn: () => api.post("/recruitment/feedback", {
      interviewId: showFeedback,
      rating: fbForm.rating,
      comment: fbForm.comment || undefined,
      status: fbForm.status,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["interviews"] }); setShowFeedback(null); setFbForm({ rating: 3, comment: "", status: "recommended" }); },
    onError: (e: any) => setError(extractError(e)),
  });

  if (listQuery.isLoading) return <Spinner />;
  if (listQuery.isError) return <ErrorState message={(listQuery.error as Error).message} />;

  const interviews = listQuery.data!;

  return (
    <div>
      <PageHeader
        title="Interviews"
        subtitle={`${interviews.length} interview(s) scheduled`}
        actions={
          <button onClick={() => { setError(""); setShowSchedule(true); }} className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={14} /> Schedule Interview
          </button>
        }
      />
      {interviews.length === 0 ? (
        <EmptyState message="No interviews scheduled yet." />
      ) : (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-neutral-800">
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Date & Time</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Feedback</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {interviews.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{i.application.candidate.firstName} {i.application.candidate.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{i.application.jobPosting.title}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDT(i.scheduledAt)}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{i.mode ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(i.status)}>{i.status}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">
                    {i.feedback.length > 0 ? (
                      <span>
                        <Badge tone={statusTone(i.feedback[0].status ?? "")}>{i.feedback[0].status}</Badge>
                        {i.feedback[0].rating && <span className="ml-1 text-[11px]">{i.feedback[0].rating}/5</span>}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">No feedback</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {i.feedback.length === 0 && (
                      <button onClick={() => { setError(""); setShowFeedback(i.id); }} className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
                        Add Feedback
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {showSchedule && (
        <Modal title="Schedule Interview" onClose={() => setShowSchedule(false)}>
          {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <div className="space-y-3">
            <Field label="Application">
              <select className="input" value={schedForm.applicationId} onChange={(e) => setSchedForm({ ...schedForm, applicationId: e.target.value })}>
                <option value="">Select application</option>
                {(appsQuery.data ?? []).map((a: ApplicationOption) => (
                  <option key={a.id} value={a.id}>{a.candidate.firstName} {a.candidate.lastName} — {a.jobPosting.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Date & Time">
              <input className="input" type="datetime-local" value={schedForm.scheduledAt} onChange={(e) => setSchedForm({ ...schedForm, scheduledAt: e.target.value })} />
            </Field>
            <Field label="Mode">
              <select className="input" value={schedForm.mode} onChange={(e) => setSchedForm({ ...schedForm, mode: e.target.value })}>
                <option value="video">Video</option>
                <option value="in_person">In Person</option>
                <option value="phone">Phone</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSchedule(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => scheduleMut.mutate()} disabled={!schedForm.applicationId || !schedForm.scheduledAt || scheduleMut.isPending} className="btn-primary">
                {scheduleMut.isPending ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showFeedback && (
        <Modal title="Interview Feedback" onClose={() => setShowFeedback(null)}>
          {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <div className="space-y-3">
            <Field label="Rating (1-5)">
              <input className="input" type="number" min={1} max={5} value={fbForm.rating} onChange={(e) => setFbForm({ ...fbForm, rating: Number(e.target.value) })} />
            </Field>
            <Field label="Recommendation">
              <select className="input" value={fbForm.status} onChange={(e) => setFbForm({ ...fbForm, status: e.target.value })}>
                <option value="recommended">Recommended</option>
                <option value="hold">Hold</option>
                <option value="reject">Reject</option>
              </select>
            </Field>
            <Field label="Comment">
              <textarea className="input" rows={3} value={fbForm.comment} onChange={(e) => setFbForm({ ...fbForm, comment: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowFeedback(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => feedbackMut.mutate()} disabled={feedbackMut.isPending} className="btn-primary">
                {feedbackMut.isPending ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
