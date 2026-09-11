import { useAuth } from "../../auth/AuthContext";
import { SystemDashboard } from "./SystemDashboard";
import { CompanyDashboard } from "./CompanyDashboard";
import { HrDashboard } from "./HrDashboard";
import { HrManagerDashboard } from "./HrManagerDashboard";
import { DeptManagerDashboard } from "./DeptManagerDashboard";
import { TeamLeadDashboard } from "./TeamLeadDashboard";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { RecruiterDashboard } from "./RecruiterDashboard";
import { PayrollManagerDashboard } from "../payroll/PayrollManagerDashboard";

export function DashboardPage() {
  const { me } = useAuth();
  const isSuperAdmin = me?.isSuperAdmin || (me?.permissions ?? []).includes("*");
  const isCompanyAdmin = (me?.roles ?? []).includes("company_admin");
  const isHRAdmin = (me?.roles ?? []).includes("hr_admin");
  const isHRManager = (me?.roles ?? []).includes("hr_manager");
  const isDeptManager = (me?.roles ?? []).includes("department_manager");
  const isTeamLead = (me?.roles ?? []).includes("team_lead");
  const isRecruiter = (me?.roles ?? []).includes("recruiter");
  const isPayrollManager = (me?.roles ?? []).includes("payroll_manager");

  if (isSuperAdmin) return <SystemDashboard />;
  if (isCompanyAdmin) return <CompanyDashboard />;
  if (isHRAdmin) return <HrDashboard />;
  if (isHRManager) return <HrManagerDashboard />;
  if (isDeptManager) return <DeptManagerDashboard />;
  if (isTeamLead) return <TeamLeadDashboard />;
  if (isRecruiter) return <RecruiterDashboard />;
  if (isPayrollManager) return <PayrollManagerDashboard />;

  return <EmployeeDashboard />;
}
