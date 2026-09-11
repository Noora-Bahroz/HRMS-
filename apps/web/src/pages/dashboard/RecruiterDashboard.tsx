import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  FileText,
  CalendarClock,
  MessageSquare,
  Gift,
  TrendingUp,
  ArrowRight,
  UserPlus,
  ClipboardList,
  Handshake,
  UserCircle2,
} from "lucide-react";
import { api } from "../../api/client";
import { Card, PageHeader, Spinner, ErrorState } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";

interface RecruitmentStats {
  requisitions: { total: number; open: number };
  postings: number;
  candidates: number;
  applications: { byStatus: Record<string, number> };
  interviews: {
    upcoming: { id: string; scheduledAt: string; mode: string | null; candidateName: string; jobTitle: string }[];
    pendingFeedback: number;
  };
  offers: { total: number; accepted: number };
  hired: number;
  conversionRate: number;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function RecruiterDashboard() {
  const { me } = useAuth();

  const statsQuery = useQuery({
    queryKey: ["recruitment-stats"],
    queryFn: async () => (await api.get("/recruitment/stats")).data.data as RecruitmentStats,
    enabled: !!me,
  });

  if (statsQuery.isLoading) return <Spinner />;
  if (statsQuery.isError) return <ErrorState message={(statsQuery.error as Error).message} />;

  const s = statsQuery.data!;
  const pipelineTotal = Object.values(s.applications.byStatus).reduce((a, b) => a + b, 0);

  const stats = [
    { label: "Open Requisitions", value: String(s.requisitions.open), icon: Briefcase, tone: "bg-blue-100 text-blue-700" },
    { label: "Active Postings", value: String(s.postings), icon: FileText, tone: "bg-cyan-100 text-cyan-700" },
    { label: "Total Candidates", value: String(s.candidates), icon: Users, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Applications", value: String(pipelineTotal), icon: ClipboardList, tone: "bg-purple-100 text-purple-700" },
    { label: "Upcoming Interviews", value: String(s.interviews.upcoming.length), icon: CalendarClock, tone: "bg-amber-100 text-amber-700" },
    { label: "Pending Feedback", value: String(s.interviews.pendingFeedback), icon: MessageSquare, tone: "bg-rose-100 text-rose-700" },
    { label: "Offers Extended", value: String(s.offers.total), icon: Gift, tone: "bg-indigo-100 text-indigo-700" },
    { label: "Conversion Rate", value: `${s.conversionRate}%`, icon: TrendingUp, tone: "bg-teal-100 text-teal-700" },
  ];

  const appStatuses = ["applied", "screening", "interview", "offer", "hired", "rejected"];

  return (
    <div>
      <PageHeader
        title="Recruitment Dashboard"
        subtitle={`Welcome back, ${me?.fullName ?? "Recruiter"}. You have ${s.requisitions.open} open requisition(s) and ${s.interviews.pendingFeedback} pending interview feedback(s).`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <UserCircle2 size={13} />
            {me?.fullName ?? "Recruiter"} · Recruiter
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((st) => (
          <Card key={st.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">{st.label}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{st.value}</div>
              </div>
              <div className={`rounded-lg p-2.5 ${st.tone}`}>
                <st.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Application Pipeline</h3>
            <Link to="/recruitment/pipeline" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View pipeline
            </Link>
          </div>
          <div className="space-y-3">
            {appStatuses.map((st) => {
              const count = s.applications.byStatus[st] || 0;
              const pct = pipelineTotal > 0 ? Math.round((count / pipelineTotal) * 100) : 0;
              return (
                <div key={st} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-gray-500 capitalize">{st}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-neutral-800">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-gray-700">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Upcoming Interviews</h3>
            <Link to="/recruitment/interviews" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all
            </Link>
          </div>
          {s.interviews.upcoming.length === 0 ? (
            <p className="text-xs text-gray-400">No upcoming interviews.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
              {s.interviews.upcoming.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
                      <CalendarClock size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-700">{i.candidateName}</div>
                      <div className="text-[11px] text-gray-400">{i.jobTitle} · {i.mode ?? "TBD"}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500">{formatDateTime(i.scheduledAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link to="/recruitment/requisitions">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
                <Briefcase size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Job Requisitions</div>
                <div className="text-xs text-gray-500">Create and manage open positions.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>

        <Link to="/recruitment/candidates">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700">
                <UserPlus size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Candidates</div>
                <div className="text-xs text-gray-500">Manage candidate profiles and CVs.</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>

        <Link to="/recruitment/offers">
          <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2.5 text-indigo-700">
                <Handshake size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Offers</div>
                <div className="text-xs text-gray-500">{s.offers.total} total · {s.offers.accepted} accepted</div>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
