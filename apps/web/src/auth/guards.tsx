import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../auth/auth";
import { AppLayout } from "../components/layout/AppLayout";
import { Spinner } from "../components/ui/ui";
import { useLocation } from "react-router-dom";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!me) return <Navigate to="/login" state={{ from: location }} replace />;
  return <AppLayout>{children}</AppLayout>;
}

function Denied() {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-16 text-center">
      <div className="text-sm font-medium text-gray-700">Access denied</div>
      <p className="max-w-md text-xs text-gray-400">
        You do not have permission to view this page. Contact an administrator if you believe this
        is a mistake.
      </p>
    </div>
  );
}

export function RoleGate({
  permission,
  denyForRoles,
  children,
}: {
  permission: string;
  denyForRoles?: string[];
  children: ReactNode;
}) {
  const { me } = useAuth();
  if (!me) return null;
  if (denyForRoles?.some((r) => (me.roles ?? []).includes(r))) {
    return <Denied />;
  }
  if (!hasPermission(me, permission)) {
    return <Denied />;
  }
  return <>{children}</>;
}
