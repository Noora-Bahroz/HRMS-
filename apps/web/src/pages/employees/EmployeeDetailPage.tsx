import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  Pencil,
  Trash2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
} from "lucide-react";
import { api } from "../../api/client";
import { Badge, Spinner, ErrorState, EmptyState, statusTone } from "../../components/ui/ui";
import { PageHeader } from "../../components/ui/ui";
import { SectionCard, InfoItem } from "./components";
import { fullName, fmtDate, type EmployeeDetail } from "./types";
import {
  AddContactModal,
  AddSkillModal,
  AddQualificationModal,
  AddCertificationModal,
  AddEmploymentHistoryModal,
  AddDocumentModal,
  EditEmployeeModal,
} from "./subforms";

const DOC_TYPE_LABEL: Record<string, string> = {
  contract: "Contract",
  offer: "Offer letter",
  certificate: "Certificate",
  id: "ID",
  policy: "Policy",
  other: "Other",
};

export function EmployeeDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const [modal, setModal] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["employee", id],
    queryFn: async () =>
      (await api.get<{ data: EmployeeDetail }>(`/employees/${id}`)).data.data,
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["employee", id] });
    qc.invalidateQueries({ queryKey: ["employees"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ kind, subId }: { kind: string; subId: string }) =>
      (await api.delete(`/employees/${id}/${kind}/${subId}`)).data,
    onSuccess: invalidate,
  });

  async function downloadFile(fileId: string, fileName: string) {
    try {
      const res = await api.get(`/employees/files/${fileId}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download the file.");
    }
  }

  if (query.isLoading) return <Spinner />;
  if (query.isError) return <ErrorState message={(query.error as Error).message} />;
  const e = query.data;
  if (!e) return <ErrorState message="Employee not found." />;

  const removeItem = (kind: string, subId: string, label: string) => {
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) deleteMutation.mutate({ kind, subId });
  };

  return (
    <div>
      <PageHeader
        title="Employee Profile"
        subtitle={`${fullName(e)} · ${e.employeeNumber}`}
        actions={
          <Link to="/employees" className="btn-secondary">
            <ArrowLeft size={16} /> Back to Employees
          </Link>
        }
      />

      {/* Profile header */}
      <div className="card mb-6 flex flex-wrap items-center gap-5 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
          {e.firstName.charAt(0)}
          {e.lastName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">{fullName(e)}</h1>
            <Badge tone={statusTone(e.employmentStatus)}>{e.employmentStatus.replace("_", " ")}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5"><Mail size={14} />{e.email}</span>
            {e.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} />{e.phone}</span>}
            {e.Department && <span className="inline-flex items-center gap-1.5"><Building2 size={14} />{e.Department.name}</span>}
            {e.Designation && <span className="inline-flex items-center gap-1.5"><Briefcase size={14} />{e.Designation.title}</span>}
            {e.dateOfJoining && <span className="inline-flex items-center gap-1.5"><Calendar size={14} />Joined {fmtDate(e.dateOfJoining)}</span>}
            {e.address && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{e.address}</span>}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal("edit")}>
          <Pencil size={16} /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6">
          <SectionCard
            title="Personal Information"
            action={
              <button className="btn-secondary" onClick={() => setModal("edit")}>
                <Pencil size={14} /> Edit
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="First name" value={e.firstName} />
              <InfoItem label="Last name" value={e.lastName} />
              <InfoItem label="Email" value={e.email} />
              <InfoItem label="Phone" value={e.phone} />
              <InfoItem label="Gender" value={e.gender} />
              <InfoItem label="Marital status" value={e.maritalStatus} />
              <InfoItem label="Date of birth" value={fmtDate(e.dateOfBirth)} />
              <InfoItem label="Address" value={e.address} />
            </div>
          </SectionCard>

          <SectionCard
            title="Emergency Contacts"
            action={
              <button onClick={() => setModal("contact")} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={14} /> Add
              </button>
            }
          >
            {e.emergencyContacts.length === 0 ? (
              <EmptyState message="No emergency contacts." />
            ) : (
              <ul className="space-y-3">
                {e.emergencyContacts.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{c.name}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">
                        {c.relationship} · {c.phone}
                      </div>
                    </div>
                    <button onClick={() => removeItem("emergency-contacts", c.id, c.name)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Skills"
            action={
              <button onClick={() => setModal("skill")} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={14} /> Add
              </button>
            }
          >
            {e.skills.length === 0 ? (
              <EmptyState message="No skills added." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {e.skills.map((s) => (
                  <span key={s.id} className="group inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-sm text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {s.skill}
                    {s.level && <span className="text-xs text-brand-400 dark:text-brand-400">· {s.level}</span>}
                    <button onClick={() => removeItem("skills", s.id, s.skill)} className="text-brand-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Qualifications"
            action={
              <button onClick={() => setModal("qualification")} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={14} /> Add
              </button>
            }
          >
            {e.qualifications.length === 0 ? (
              <EmptyState message="No qualifications." />
            ) : (
              <ul className="space-y-3">
                {e.qualifications.map((q) => (
                  <li key={q.id} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{q.degree}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">
                        {q.institution}
                        {q.year ? ` · ${q.year}` : ""}
                      </div>
                    </div>
                    <button onClick={() => removeItem("qualifications", q.id, q.degree)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Employment Information"
            action={
              <button className="btn-secondary" onClick={() => setModal("edit")}>
                <Pencil size={14} /> Edit
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem label="Employee number" value={e.employeeNumber} />
              <InfoItem label="Department" value={e.Department?.name} />
              <InfoItem label="Designation" value={e.Designation?.title} />
              <InfoItem label="Team" value={e.Team?.name} />
              <InfoItem label="Branch" value={e.Branch?.name} />
              <InfoItem label="Reporting manager" value={e.reportingManager ? fullName(e.reportingManager) : "—"} />
              <InfoItem label="Employment type" value={e.employmentType ? e.employmentType.charAt(0).toUpperCase() + e.employmentType.slice(1) : undefined} />
              <InfoItem label="Employment status" value={e.employmentStatus.replace("_", " ")} />
              <InfoItem label="Date of joining" value={fmtDate(e.dateOfJoining)} />
              <InfoItem label="Date of exit" value={fmtDate(e.dateOfExit)} />
              <InfoItem label="Exit reason" value={e.exitReason} />
            </div>
          </SectionCard>

          <SectionCard
            title="Employment History"
            action={
              <button onClick={() => setModal("history")} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={14} /> Add
              </button>
            }
          >
            {e.employmentHistory.length === 0 ? (
              <EmptyState message="No employment history." />
            ) : (
              <ul className="space-y-3">
                {e.employmentHistory.map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{h.role}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">
                        {h.company} · {fmtDate(h.startDate)} — {h.endDate ? fmtDate(h.endDate) : "Present"}
                      </div>
                    </div>
                    <button onClick={() => removeItem("employment-history", h.id, `${h.role} at ${h.company}`)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Certifications"
            action={
              <button onClick={() => setModal("certification")} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={14} /> Add
              </button>
            }
          >
            {e.certifications.length === 0 ? (
              <EmptyState message="No certifications." />
            ) : (
              <ul className="space-y-3">
                {e.certifications.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{c.name}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">
                        {c.issuer && `${c.issuer} · `}
                        {c.validUntil ? `Valid until ${fmtDate(c.validUntil)}` : "No expiry"}
                      </div>
                    </div>
                    <button onClick={() => removeItem("certifications", c.id, c.name)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Documents & Attachments"
            action={
              <button onClick={() => setModal("document")} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Plus size={14} /> Upload
              </button>
            }
          >
            {e.documents.length === 0 ? (
              <EmptyState message="No documents uploaded." />
            ) : (
              <ul className="space-y-2">
                {e.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-neutral-800">
                    <FileText size={18} className="text-brand-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">{d.title}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">
                        {DOC_TYPE_LABEL[d.docType] ?? d.docType}
                        {d.expiresAt ? ` · expires ${fmtDate(d.expiresAt)}` : ""}
                      </div>
                    </div>
                    <button onClick={() => downloadFile(d.fileId, d.title)} title="Download" className="text-gray-400 hover:text-brand-600">
                      <Download size={16} />
                    </button>
                    <button onClick={() => removeItem("documents", d.id, d.title)} title="Delete" className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {modal === "edit" && <EditEmployeeModal detail={e} onClose={() => setModal(null)} />}
      {modal === "contact" && <AddContactModal employeeId={e.id} onClose={() => setModal(null)} />}
      {modal === "skill" && <AddSkillModal employeeId={e.id} onClose={() => setModal(null)} />}
      {modal === "qualification" && <AddQualificationModal employeeId={e.id} onClose={() => setModal(null)} />}
      {modal === "certification" && <AddCertificationModal employeeId={e.id} onClose={() => setModal(null)} />}
      {modal === "history" && <AddEmploymentHistoryModal employeeId={e.id} onClose={() => setModal(null)} />}
      {modal === "document" && <AddDocumentModal employeeId={e.id} onClose={() => setModal(null)} />}
    </div>
  );
}
