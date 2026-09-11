export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface EmployeeDocument {
  id: string;
  fileId: string;
  docType: string;
  title: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface EmployeeSkill {
  id: string;
  skill: string;
  level: string | null;
}

export interface Qualification {
  id: string;
  degree: string;
  institution: string;
  year: number | null;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string | null;
  validUntil: string | null;
}

export interface EmploymentHistory {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
}

export interface EmployeeDetail {
  id: string;
  tenantId: string;
  employeeNumber: string;
  userId: string | null;
  companyId: string;
  branchId: string | null;
  departmentId: string | null;
  teamId: string | null;
  designationId: string | null;
  reportingManagerId: string | null;
  costCenterId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  dateOfJoining: string | null;
  dateOfExit: string | null;
  employmentStatus: string;
  employmentType: string | null;
  maritalStatus: string | null;
  avatarFileId: string | null;
  address: string | null;
  exitReason: string | null;
  emergencyContacts: EmergencyContact[];
  documents: EmployeeDocument[];
  skills: EmployeeSkill[];
  qualifications: Qualification[];
  certifications: Certification[];
  employmentHistory: EmploymentHistory[];
  reportingManager: { id: string; firstName: string; lastName: string; email: string } | null;
  Department: { id: string; name: string } | null;
  Designation: { id: string; title: string } | null;
  Team: { id: string; name: string } | null;
  Branch: { id: string; name: string } | null;
}

export interface EmployeeRow {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  employmentStatus: string;
  employmentType: string | null;
  dateOfJoining: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function fullName(e: { firstName: string; lastName: string }): string {
  return `${e.firstName} ${e.lastName}`.trim();
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export const EMPLOYMENT_STATUSES = ["active", "on_leave", "inactive", "terminated"] as const;
export const EMPLOYMENT_TYPES = ["permanent", "contract", "intern", "probation"] as const;
export const DOC_TYPES = ["contract", "offer", "certificate", "id", "policy", "other"] as const;
export const GENDERS = ["Male", "Female", "Other"] as const;
export const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"] as const;
