import { useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../auth/auth";
import { useTheme } from "../../theme/ThemeContext";
import { filterNavByPermissions, NAV_GROUPS } from "./nav";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";

export function AppLayout({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(false);

  const can = (p: string) => hasPermission(me, p);
  const groups = me ? filterNavByPermissions(NAV_GROUPS, can, me.scope, me.roles) : NAV_GROUPS;

  const collapsed = !hovered;

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex"
      >
        <Sidebar groups={groups} collapsed={collapsed} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-800 dark:text-neutral-100">HRMS</span>
            <span className="text-gray-300 dark:text-neutral-600">/</span>
            <span>Home</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {me ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
