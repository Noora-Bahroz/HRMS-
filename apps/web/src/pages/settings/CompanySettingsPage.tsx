import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Check, X } from "lucide-react";
import { api, extractError } from "../../api/client";
import { PageHeader, Card, Spinner, ErrorState, Badge } from "../../components/ui/ui";
import { useAuth } from "../../auth/AuthContext";

interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  timezone: string;
  currency: string;
  status: string;
}
interface Branch {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  city?: string | null;
  country?: string | null;
}
interface Department {
  id: string;
  name: string;
  code?: string | null;
  branchId?: string | null;
}
interface Team {
  id: string;
  name: string;
  departmentId: string;
}
interface Designation {
  id: string;
  title: string;
  level?: number | null;
}

export function CompanySettingsPage() {
  const { me } = useAuth();
  const isSuperAdmin = me?.isSuperAdmin || (me?.permissions ?? []).includes("*");
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: "", legalName: "" });
  const [branchForm, setBranchForm] = useState({ companyId: "", name: "", code: "", city: "" });

  const companiesQuery = useQuery({
    queryKey: ["org-companies"],
    queryFn: async () => (await api.get<{ data: Company[] }>("/organization/companies")).data.data,
  });
  const branchesQuery = useQuery({
    queryKey: ["org-branches"],
    queryFn: async () => (await api.get<{ data: Branch[] }>("/organization/branches")).data.data,
  });
  const departmentsQuery = useQuery({
    queryKey: ["org-departments"],
    queryFn: async () => (await api.get<{ data: Department[] }>("/organization/departments")).data.data,
  });
  const teamsQuery = useQuery({
    queryKey: ["org-teams"],
    queryFn: async () => (await api.get<{ data: Team[] }>("/organization/teams")).data.data,
  });
  const designationsQuery = useQuery({
    queryKey: ["org-designations"],
    queryFn: async () => (await api.get<{ data: Designation[] }>("/organization/designations")).data.data,
  });

  const companies = companiesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const designations = designationsQuery.data ?? [];

  const createCompany = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/organization/companies", {
        name: companyForm.name,
        legalName: companyForm.legalName || undefined,
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-companies"] });
      setShowCompanyForm(false);
      setCompanyForm({ name: "", legalName: "" });
      setMessage("Company created.");
      setErrMessage(null);
    },
    onError: (e) => setErrMessage(extractError(e) || "Failed to create company."),
  });

  const createBranch = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/organization/branches", {
        companyId: branchForm.companyId,
        name: branchForm.name,
        code: branchForm.code || undefined,
        city: branchForm.city || undefined,
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-branches"] });
      setShowBranchForm(false);
      setBranchForm({ companyId: branchForm.companyId || "", name: "", code: "", city: "" });
      setMessage("Branch created.");
      setErrMessage(null);
    },
    onError: (e) => setErrMessage(extractError(e) || "Failed to create branch."),
  });

  if (
    companiesQuery.isLoading ||
    branchesQuery.isLoading ||
    departmentsQuery.isLoading ||
    teamsQuery.isLoading ||
    designationsQuery.isLoading
  )
    return <Spinner />;
  if (
    companiesQuery.isError ||
    branchesQuery.isError ||
    departmentsQuery.isError ||
    teamsQuery.isError ||
    designationsQuery.isError
  )
    return <ErrorState message="Failed to load organization data." />;

  return (
    <div>
      <PageHeader
        title="Company / System Settings"
        subtitle="Companies, branches, departments, teams, and designations."
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800 dark:text-neutral-100">Companies</span>
              <span className="text-xs text-gray-400">({companies.length})</span>
            </div>
            {isSuperAdmin && (
              <button
                className="btn-secondary inline-flex items-center gap-1 py-1 text-xs"
                onClick={() => setShowCompanyForm((s) => !s)}
              >
                <Plus size={14} /> New
              </button>
            )}
          </div>
          {showCompanyForm && (
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
              <input
                className="input flex-1 min-w-[160px]"
                placeholder="Company name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              />
              <input
                className="input flex-1 min-w-[160px]"
                placeholder="Legal name (optional)"
                value={companyForm.legalName}
                onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })}
              />
              <button
                className="btn-primary"
                disabled={!companyForm.name.trim() || createCompany.isPending}
                onClick={() => createCompany.mutate()}
              >
                {createCompany.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          )}
          <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
            {companies.length === 0 && <li className="px-4 py-6 text-center text-xs text-gray-400">No companies.</li>}
            {companies.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{c.name}</div>
                  <Badge tone={c.status === "active" ? "green" : "gray"}>{c.status}</Badge>
                </div>
                <div className="mt-0.5 text-xs text-gray-400">
                  {c.legalName || "—"} · {c.timezone} · {c.currency}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800 dark:text-neutral-100">Branches</span>
              <span className="text-xs text-gray-400">({branches.length})</span>
            </div>
            <button
              className="btn-secondary inline-flex items-center gap-1 py-1 text-xs"
              onClick={() => setShowBranchForm((s) => !s)}
            >
              <Plus size={14} /> New
            </button>
          </div>
          {showBranchForm && (
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
              <select
                className="input flex-1 min-w-[140px]"
                value={branchForm.companyId}
                onChange={(e) => setBranchForm({ ...branchForm, companyId: e.target.value })}
              >
                <option value="">Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="input flex-1 min-w-[140px]"
                placeholder="Branch name"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              />
              <input
                className="input w-24"
                placeholder="Code"
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
              />
              <button
                className="btn-primary"
                disabled={!branchForm.companyId || !branchForm.name.trim() || createBranch.isPending}
                onClick={() => createBranch.mutate()}
              >
                {createBranch.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          )}
          <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
            {branches.length === 0 && <li className="px-4 py-6 text-center text-xs text-gray-400">No branches.</li>}
            {branches.map((b) => (
              <li key={b.id} className="px-4 py-3">
                <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{b.name}</div>
                <div className="mt-0.5 text-xs text-gray-400">
                  {[b.code, b.city, b.country].filter(Boolean).join(" · ") || "—"}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-neutral-100">
              Departments <span className="text-xs font-normal text-gray-400">({departments.length})</span>
            </span>
          </div>
          <ul className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-neutral-800 sm:grid-cols-2 sm:divide-y-0">
            {departments.length === 0 && <li className="px-4 py-6 text-center text-xs text-gray-400">No departments.</li>}
            {departments.map((d) => (
              <li key={d.id} className="px-4 py-3">
                <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{d.name}</div>
                <div className="text-xs text-gray-400">{d.code || "—"}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-neutral-100">
              Teams <span className="text-xs font-normal text-gray-400">({teams.length})</span>
            </span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
            {teams.length === 0 && <li className="px-4 py-6 text-center text-xs text-gray-400">No teams.</li>}
            {teams.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{t.name}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 dark:border-neutral-800">
          <span className="text-sm font-semibold text-gray-800 dark:text-neutral-100">
            Designations <span className="text-xs font-normal text-gray-400">({designations.length})</span>
          </span>
        </div>
        <ul className="flex flex-wrap gap-2 p-4">
          {designations.length === 0 && <li className="text-xs text-gray-400">No designations.</li>}
          {designations.map((d) => (
            <li key={d.id}>
              <Badge tone={d.level != null && d.level >= 3 ? "purple" : "gray"}>
                {d.title}
                {d.level != null ? ` · L${d.level}` : ""}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}