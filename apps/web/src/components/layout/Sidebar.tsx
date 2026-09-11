import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { NavGroup } from "./nav";

interface SidebarProps {
  groups: NavGroup[];
  collapsed: boolean;
}

export function Sidebar({ groups, collapsed }: SidebarProps) {
  const flatItems = groups.flatMap((g) => g.items);

  return (
    <aside
      className={clsx(
        "flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-in-out dark:border-neutral-800 dark:bg-neutral-900",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center border-b border-gray-200 px-3 dark:border-neutral-800">
        <Link
          to="/"
          title="Go to Home"
          className="group flex items-center gap-2 overflow-hidden rounded-md px-1 py-0.5 transition-colors hover:bg-brand-50 dark:hover:bg-neutral-800"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-brand-600 text-sm font-bold text-white">
            H
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap text-sm font-semibold text-gray-800 group-hover:text-brand-600 dark:text-neutral-100 dark:group-hover:text-brand-400">
              HRMS
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-2 py-2">
        {collapsed ? (
          <div className="space-y-0.5">
            {flatItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
                className={({ isActive }) =>
                  clsx(
                    "flex justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
                    isActive && "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400"
                  )
                }
              >
                <item.icon size={20} />
              </NavLink>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {groups.map((group) => (
              <SidebarGroup key={group.label} group={group} />
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}

function SidebarGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
      >
        {group.label}
        <ChevronDown
          size={14}
          className={clsx("transition-transform", !open && "-rotate-90")}
        />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  isActive && "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-400"
                )
              }
            >
              <item.icon size={17} className="text-gray-400 dark:text-neutral-500" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
