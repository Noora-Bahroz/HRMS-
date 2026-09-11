import {
  LayoutDashboard,
  Users,
  UserRound,
  Building2,
  CalendarDays,
  Clock,
  Wallet,
  Receipt,
  Monitor,
  BarChart3,
  IdCard,
  UserCog,
  FolderOpen,
  Bell,
  ShieldCheck,
  Settings2,
  ScrollText,
  Briefcase,
  FileText,
  ClipboardList,
  CalendarClock,
  Handshake,
  Gift,
  Percent,
  Timer,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  permission?: string;
  icon: LucideIcon;
  minScope?: number;
  hideForRoles?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Home",
    items: [{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, permission: "employee:read" }],
  },
  {
    label: "Human Resources",
    items: [
      { label: "Employees", path: "/employees", icon: Users, permission: "employee:read", minScope: 2, hideForRoles: ["recruiter"] },
      { label: "Employee Directory", path: "/employees/directory", icon: IdCard, permission: "employee:read", minScope: 2, hideForRoles: ["recruiter"] },
      { label: "Employee Documents", path: "/employees/documents", icon: FolderOpen, permission: "employee:read", hideForRoles: ["recruiter"] },
      { label: "Self Service", path: "/self-service", icon: UserCog, permission: "employee:read", hideForRoles: ["recruiter"] },
      { label: "Organization", path: "/organization", icon: Building2, permission: "org:manage" },
    ],
  },
  {
    label: "Time Off",
    items: [
      { label: "Leave", path: "/leave", icon: CalendarDays, permission: "leave:apply" },
      { label: "Attendance", path: "/attendance", icon: Clock, permission: "attendance:check_in" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "My Payslips", path: "/payroll", icon: Wallet, permission: "payroll:view" },
      { label: "Expenses", path: "/expenses", icon: Receipt, permission: "expense:submit" },
    ],
  },
  {
    label: "Payroll Management",
    items: [
      { label: "Dashboard", path: "/payroll/dashboard", icon: LayoutDashboard, permission: "payroll:read_all" },
      { label: "Payroll", path: "/payroll/runs", icon: Wallet, permission: "payroll:read_all" },
      { label: "Salary Structures", path: "/payroll/salary-structures", icon: Building2, permission: "payroll:read_all" },
      { label: "Employee Salaries", path: "/payroll/employee-salaries", icon: Users, permission: "payroll:read_all" },
      { label: "Payroll Periods", path: "/payroll/periods", icon: CalendarDays, permission: "payroll:read_all" },
      { label: "Payslips", path: "/payroll/payslips", icon: Receipt, permission: "payroll:read_all" },
      { label: "Deductions & Taxes", path: "/payroll/taxes", icon: Percent, permission: "payroll:read_all" },
      { label: "Bonuses", path: "/payroll/bonuses", icon: Gift, permission: "payroll:read_all" },
      { label: "Overtime", path: "/payroll/overtime", icon: Timer, permission: "payroll:read_all" },
      { label: "Reports", path: "/payroll/reports", icon: BarChart3, permission: "payroll:read_all" },
    ],
  },
  {
    label: "Recruitment",
    items: [
      { label: "Requisitions", path: "/recruitment/requisitions", icon: Briefcase, permission: "ats:manage_requisition" },
      { label: "Postings", path: "/recruitment/postings", icon: FileText, permission: "ats:manage_candidate" },
      { label: "Candidates", path: "/recruitment/candidates", icon: Users, permission: "ats:manage_candidate" },
      { label: "Pipeline", path: "/recruitment/pipeline", icon: ClipboardList, permission: "ats:manage_candidate" },
      { label: "Interviews", path: "/recruitment/interviews", icon: CalendarClock, permission: "ats:interview" },
      { label: "Offers", path: "/recruitment/offers", icon: Handshake, permission: "ats:offer" },
      { label: "Reports", path: "/recruitment/reports", icon: BarChart3, permission: "ats:manage_candidate" },
    ],
  },
  {
    label: "Other",
    items: [
      { label: "Assets", path: "/assets", icon: Monitor, permission: "asset:manage" },
      { label: "Announcements", path: "/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Users", path: "/settings/users", icon: UserRound, permission: "user:manage" },
      { label: "Roles & Permissions", path: "/settings/roles", icon: ShieldCheck, permission: "role:manage" },
      { label: "Company / System Settings", path: "/settings/company", icon: Settings2, permission: "settings:system" },
      { label: "Audit Logs", path: "/settings/audit", icon: ScrollText, permission: "audit:read" },
    ],
  },
];

const SCOPE_WEIGHT: Record<string, number> = { self: 1, team: 2, dept: 3, all: 4 };

const SELF_SCOPE_LABEL: Record<string, string> = {
  "/employees/documents": "My Documents",
  "/self-service": "My Profile",
  "/attendance": "My Attendance",
  "/payroll": "My Payslips",
  "/expenses": "My Expenses",
};

export function filterNavByPermissions(
  groups: NavGroup[],
  can: (permission: string) => boolean,
  scope?: string,
  roles?: string[]
): NavGroup[] {
  const weight = SCOPE_WEIGHT[scope ?? "all"] ?? 4;
  const roleSet = new Set(roles ?? []);
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter(
          (item) =>
            (!item.permission || can(item.permission)) &&
            (item.minScope ?? 1) <= weight &&
            !(item.hideForRoles?.some((r) => roleSet.has(r)) ?? false)
        )
        .map((item) =>
          scope === "self" && SELF_SCOPE_LABEL[item.path] ? { ...item, label: SELF_SCOPE_LABEL[item.path] } : item
        ),
    }))
    .filter((group) => group.items.length > 0);
}
