export interface EmployeeRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employmentStatus?: string | null;
  Department?: { name: string } | null;
  Team?: { name: string } | null;
}

export interface SalaryComponent {
  id: string;
  name: string;
  type: "earning" | "deduction";
  amount: number | string;
}

export interface SalaryStructure {
  id: string;
  name: string;
  effectiveFrom: string;
  components: SalaryComponent[];
}

export interface SalaryAssignment {
  id: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  salaryStructure: SalaryStructure;
  employee: EmployeeRef | null;
}

export interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface PayrollRun {
  id: string;
  payrollPeriodId: string;
  status: string;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  payrollPeriod?: PayrollPeriod | null;
  payslips?: Payslip[];
  _count?: { payslips: number };
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  grossPay: number | string;
  totalDeductions: number | string;
  netPay: number | string;
  details?: PayrollDetails | null;
  status: string;
  payrollRun?: { payrollPeriod?: PayrollPeriod | null } | null;
  employee?: EmployeeRef | null;
}

export interface PayrollDetails {
  structureName?: string;
  components?: { name: string; type: string; amount: number }[];
  bonuses?: { type: string; reason: string; amount: number }[];
  overtime?: { date: string; hours: number; amount: number }[];
}

export interface TaxSlab {
  id: string;
  fromAmount: number | string;
  toAmount: number | string | null;
  ratePercent: number | string;
}

export interface TaxConfig {
  id: string;
  country: string;
  taxType: string;
  slabs: TaxSlab[];
}

export interface SalaryBonus {
  id: string;
  employeeId: string;
  type: string;
  amount: number | string;
  reason: string;
  date: string;
  status: string;
  employee?: EmployeeRef | null;
}

export interface OvertimeEntry {
  id: string;
  employeeId: string;
  date: string;
  hours: number | string;
  rateFactor: number | string;
  amount: number | string;
  status: string;
  employee?: EmployeeRef | null;
}

export interface PayrollDashboard {
  employeeCount: number;
  currentPeriod: PayrollPeriod | null;
  latestRun: PayrollRun | null;
  pendingApprovals: number;
  totals: { gross: number | string; deductions: number | string; net: number | string };
  runTrend: { periodName: string | null; status: string; gross: number | string; deductions: number | string; net: number | string }[];
  bonusCount: number;
  overtimeCount: number;
}

export const money = (v: number | string | null | undefined): string => {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
};

export const employeeName = (e: EmployeeRef | null | undefined): string =>
  e ? `${e.firstName} ${e.lastName}`.trim() : "—";