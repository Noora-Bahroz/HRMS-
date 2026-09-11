import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Megaphone, X, Check } from "lucide-react";
import { api, extractError } from "../../api/client";
import { PageHeader, Card, Spinner, ErrorState, Badge } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../auth/auth";

interface Notification {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsPage() {
  const { me } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: "", body: "" });

  const canBroadcast = hasPermission(me, "settings:manage");

  const notifsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<{ data: Notification[] }>("/notifications")).data.data,
    enabled: !!me,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/notifications/${id}/read`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/notifications/read-all");
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/notifications/broadcast", {
        title: broadcast.title,
        body: broadcast.body || undefined,
        type: "announcement",
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setShowBroadcast(false);
      setBroadcast({ title: "", body: "" });
      setMessage("Announcement broadcast to all active users.");
      setErrMessage(null);
    },
    onError: (e) => setErrMessage(extractError(e) || "Failed to broadcast."),
  });

  if (notifsQuery.isLoading) return <Spinner />;
  if (notifsQuery.isError) return <ErrorState message={extractError(notifsQuery.error)} />;

  const notifications = notifsQuery.data ?? [];
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div>
      <PageHeader
        title="Announcements & Notifications"
        subtitle="Company-wide announcements and your notification inbox."
        actions={
          <button
            className="btn-secondary inline-flex items-center gap-1.5"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        }
      />

      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <Check size={16} /> {message}
        </div>
      )}
      {errMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <X size={16} /> {errMessage}
        </div>
      )}

      {canBroadcast && (
        <Card className="mb-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-neutral-100">
              <Megaphone size={16} className="text-brand-600" />
              Broadcast announcement
            </div>
            <button
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              onClick={() => setShowBroadcast((s) => !s)}
            >
              {showBroadcast ? "Hide" : "Compose"}
            </button>
          </div>
          {showBroadcast && (
            <div className="space-y-3">
              <input
                className="input"
                placeholder="Announcement title (e.g. New office holiday)"
                value={broadcast.title}
                onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
              />
              <textarea
                className="input min-h-[80px]"
                placeholder="Message body (optional)"
                value={broadcast.body}
                onChange={(e) => setBroadcast({ ...broadcast, body: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <button
                  className="btn-primary"
                  disabled={!broadcast.title.trim() || broadcastMutation.isPending}
                  onClick={() => broadcastMutation.mutate()}
                >
                  {broadcastMutation.isPending ? "Sending..." : "Send to everyone"}
                </button>
                <span className="text-xs text-gray-400">
                  Delivered as an in-app notification to all active users.
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="space-y-3">
        {notifications.length === 0 && (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <Bell size={32} className="text-gray-300" />
            <p className="text-sm text-gray-500">No notifications yet.</p>
          </Card>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            className="cursor-pointer"
            onClick={() => {
              if (!n.readAt) markRead.mutate(n.id);
            }}
          >
          <Card
            className={`p-4 transition-colors ${!n.readAt ? "border-l-4 border-l-brand-500" : "opacity-70"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-neutral-100">{n.title}</span>
                  {!n.readAt && <Badge tone="blue">new</Badge>}
                  <Badge tone="gray">{n.type}</Badge>
                </div>
                {n.body && <p className="mt-1 text-sm text-gray-600 dark:text-neutral-300">{n.body}</p>}
                <div className="mt-2 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.readAt && (
                <button
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-neutral-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead.mutate(n.id);
                  }}
                  title="Mark as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
            </div>
          </Card>
          </div>
        ))}
      </div>
    </div>
  );
}