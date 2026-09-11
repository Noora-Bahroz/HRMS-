import { ReactNode } from "react";
import clsx from "clsx";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("card", className)}>{children}</div>;
}

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-600",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof badgeColors; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", badgeColors[tone])}>
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof badgeColors {
  const s = status.toLowerCase();
  if (["active", "approved", "completed", "paid", "accepted", "hired", "present"].includes(s)) return "green";
  if (["rejected", "terminated", "inactive", "failed"].includes(s)) return "red";
  if (["pending", "submitted", "processing", "on_hold"].includes(s)) return "amber";
  if (["scheduled", "draft", "interview", "screening"].includes(s)) return "blue";
  return "gray";
}

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
      <span>
        Page {page} of {Math.max(1, totalPages)}
      </span>
      <div className="flex gap-2">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </button>
        <button className="btn-secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
