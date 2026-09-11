import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  FileText,
  ShieldCheck,
  GraduationCap,
  Award,
  Users,
  Pencil,
  UploadCloud,
  CircleUserRound,
} from "lucide-react";
import { api, extractError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader, Spinner, ErrorState, EmptyState } from "../../components/ui/ui";
import { SectionCard, InfoItem } from "./components";
import { fullName, fmtDate, type EmployeeDetail } from "./types";

const DOC_TYPE_LABEL: Record<string, string> = {
  contract: "Contract",
  offer: "Offer letter",
  certificate: "Certificate",
  id: "ID",
  policy: "Policy",
  other: "Other",
};

export function SelfServicePage() {
  const { me } = useAuth();
  const email = me?.email?.toLowerCase();

  const detailQuery = useQuery({
    queryKey: ["employee", "me", email],
    queryFn: async () =>
      (await api.get<{ data: EmployeeDetail }>("/employees/me")).data.data,
    enabled: !!email,
    retry: false,
  });

  const notFound =
    (detailQuery.isError &&
      (detailQuery.error as { response?: { status?: number } })?.response?.status === 404);

  return (
    <div>
      <PageHeader title="Self Service Portal" subtitle="Your personal HR information and documents." />

      {detailQuery.isLoading ? (
        <Spinner />
      ) : !email ? (
        <EmptyState message="Sign in to view your self-service portal." />
      ) : notFound ? (
        <EmptyState message="No employee profile is linked to your account. Contact your HR administrator if this is in error." />
      ) : detailQuery.isError ? (
        <ErrorState message={(detailQuery.error as Error).message} />
      ) : detailQuery.data ? (
        <ProfileView e={detailQuery.data} email={email} />
      ) : (
        <Spinner />
      )}
    </div>
  );
}

function ProfileView({ e, email }: { e: EmployeeDetail; email: string }) {
  const queryKey = ["employee", "me", email];

  return (
    <div>
      <div className="card mb-6 flex flex-wrap items-center gap-5 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
          {e.firstName.charAt(0)}
          {e.lastName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">{fullName(e)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5"><Mail size={14} />{e.email}</span>
            {e.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} />{e.phone}</span>}
            {e.Department && <span className="inline-flex items-center gap-1.5"><Building2 size={14} />{e.Department.name}</span>}
            {e.Designation && <span className="inline-flex items-center gap-1.5"><Briefcase size={14} />{e.Designation.title}</span>}
            {e.dateOfJoining && <span className="inline-flex items-center gap-1.5"><Calendar size={14} />Joined {fmtDate(e.dateOfJoining)}</span>}
            {e.address && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{e.address}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <SectionCard title="Personal Information">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Full name" value={fullName(e)} />
              <InfoItem label="Email" value={e.email} />
              <InfoItem label="Phone" value={e.phone} />
              <InfoItem label="Gender" value={e.gender} />
              <InfoItem label="Marital status" value={e.maritalStatus} />
              <InfoItem label="Date of birth" value={fmtDate(e.dateOfBirth)} />
              <InfoItem label="Address" value={e.address} />
              <InfoItem label="Employee number" value={e.employeeNumber} />
            </div>
          </SectionCard>

          <EditSelfProfile queryKey={queryKey} initial={e} />

          <SectionCard title="Emergency Contacts">
            {e.emergencyContacts.length === 0 ? (
              <EmptyState message="No emergency contacts." />
            ) : (
              <ul className="space-y-3">
                {e.emergencyContacts.map((c) => (
                  <li key={c.id}>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-neutral-100">
                      <Users size={15} className="text-brand-500" /> {c.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-neutral-400">
                      {c.relationship} · {c.phone}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Employment Details">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem label="Employee number" value={e.employeeNumber} />
              <InfoItem label="Department" value={e.Department?.name} />
              <InfoItem label="Designation" value={e.Designation?.title} />
              <InfoItem label="Team" value={e.Team?.name} />
              <InfoItem label="Branch" value={e.Branch?.name} />
              <InfoItem label="Reporting manager" value={e.reportingManager ? fullName(e.reportingManager) : "—"} />
              <InfoItem label="Employment type" value={e.employmentType?.charAt(0).toUpperCase() + (e.employmentType?.slice(1) ?? "")} />
              <InfoItem label="Status" value={e.employmentStatus.replace("_", " ")} />
              <InfoItem label="Date of joining" value={fmtDate(e.dateOfJoining)} />
            </div>
          </SectionCard>

          <SectionCard title="Skills, Qualifications & Certifications">
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500">
                  <ShieldCheck size={14} /> Skills
                </div>
                {e.skills.length === 0 ? (
                  <p className="text-sm text-gray-400">None</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {e.skills.map((s) => (
                      <span key={s.id} className="rounded-full bg-brand-50 px-2.5 py-1 text-sm text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        {s.skill}
                        {s.level && <span className="text-xs text-brand-400"> · {s.level}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500">
                  <GraduationCap size={14} /> Qualifications
                </div>
                {e.qualifications.length === 0 ? (
                  <p className="text-sm text-gray-400">None</p>
                ) : (
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-neutral-200">
                    {e.qualifications.map((q) => (
                      <li key={q.id}>
                        {q.degree} — {q.institution}
                        {q.year ? ` (${q.year})` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500">
                  <Award size={14} /> Certifications
                </div>
                {e.certifications.length === 0 ? (
                  <p className="text-sm text-gray-400">None</p>
                ) : (
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-neutral-200">
                    {e.certifications.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </SectionCard>

          <MyDocuments queryKey={queryKey} documents={e.documents} />
        </div>
      </div>
    </div>
  );
}

function EditSelfProfile({
  queryKey,
  initial,
}: {
  queryKey: string[];
  initial: EmployeeDetail;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [maritalStatus, setMaritalStatus] = useState(initial.maritalStatus ?? "");
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (payload: { phone?: string; address?: string; maritalStatus?: string }) =>
      api.patch("/employees/me", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditing(false);
    },
    onError: (err) => setError(extractError(err)),
  });

  if (!editing) {
    return (
      <SectionCard title="Update Profile">
        <p className="mb-3 text-xs text-gray-500 dark:text-neutral-400">
          Keep your contact information up to date. Only phone, address, and marital status can be changed here.
        </p>
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Pencil size={14} /> Edit profile
        </button>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Update Profile">
      <div className="space-y-3">
        <label className="block text-xs text-gray-500 dark:text-neutral-400">
          Phone
          <input
            value={phone}
            onChange={(ev) => setPhone(ev.target.value)}
            placeholder="+1 555 000 0000"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="block text-xs text-gray-500 dark:text-neutral-400">
          Address
          <input
            value={address}
            onChange={(ev) => setAddress(ev.target.value)}
            placeholder="Street, City, Country"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="block text-xs text-gray-500 dark:text-neutral-400">
          Marital status
          <select
            value={maritalStatus}
            onChange={(ev) => setMaritalStatus(ev.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">—</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              updateMutation.mutate({
                phone: phone || undefined,
                address: address || undefined,
                maritalStatus: maritalStatus || undefined,
              })
            }
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <CircleUserRound size={14} /> Save changes
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function MyDocuments({ queryKey, documents }: { queryKey: string[]; documents: EmployeeDetail["documents"] }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("contract");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      if (file) form.append("file", file);
      form.append("docType", docType);
      form.append("title", title);
      return api.post("/employees/me/documents/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setTitle("");
      setFile(null);
      const input = document.getElementById("my-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
    },
    onError: (err) => setError(extractError(err)),
  });

  return (
    <SectionCard title="My Documents">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500">
        <FileText size={14} /> Attachments
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-3 dark:border-neutral-800">
        <label className="block flex-1 min-w-40 text-xs text-gray-500 dark:text-neutral-400">
          File
          <input
            id="my-document-file"
            type="file"
            onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700 dark:text-neutral-200 dark:file:bg-brand-900/40 dark:file:text-brand-300"
          />
        </label>
        <label className="block w-36 text-xs text-gray-500 dark:text-neutral-400">
          Type
          <select
            value={docType}
            onChange={(ev) => setDocType(ev.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {Object.entries(DOC_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block flex-1 min-w-40 text-xs text-gray-500 dark:text-neutral-400">
          Title
          <input
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            placeholder="e.g. 2026 employment contract"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          onClick={() => uploadMutation.mutate()}
          disabled={!file || uploadMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadCloud size={14} /> Upload
        </button>
      </div>
      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
      {documents.length === 0 ? (
        <EmptyState message="No documents on file." />
      ) : (
        <ul className="space-y-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-neutral-800">
              <FileText size={18} className="text-brand-500" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-800 dark:text-neutral-100">{d.title}</div>
                <div className="text-xs text-gray-500 dark:text-neutral-400">
                  {DOC_TYPE_LABEL[d.docType] ?? d.docType}
                  {d.expiresAt ? ` · expires ${fmtDate(d.expiresAt)}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
