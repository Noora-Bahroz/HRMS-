import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, CircleUser, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function roleLabel(roles: string[] | undefined) {
  const list = roles ?? [];
  if (list.includes("super_admin")) return "Super Admin";
  if (list.length > 0) return list[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return "Member";
}

export function UserMenu() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!me) return null;

  const role = roleLabel(me.roles);
  const isSuperAdmin = me.isSuperAdmin || (me.permissions ?? []).includes("*");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-neutral-800"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {initials(me.fullName)}
        </div>
        <div className="hidden text-left md:block">
          <div className="text-sm font-medium leading-tight text-gray-800 dark:text-neutral-100">
            {me.fullName}
          </div>
          <div className="flex items-center gap-1 text-xs leading-tight text-gray-400 dark:text-neutral-400">
            {isSuperAdmin && <ShieldCheck size={11} className="text-brand-500" />}
            {role}
          </div>
        </div>
        <ChevronDown size={14} className="hidden text-gray-400 md:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-neutral-700">
              <div className="text-sm font-semibold text-gray-800 dark:text-neutral-100">{me.fullName}</div>
              <div className="truncate text-xs text-gray-400">{me.email}</div>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <ShieldCheck size={11} />
                  {role}
                </span>
              </div>
            </div>
            <div className="p-1.5">
              <Link
                to="/self-service"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <CircleUser size={16} className="text-gray-400" />
                Account / Profile
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                  navigate("/");
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}