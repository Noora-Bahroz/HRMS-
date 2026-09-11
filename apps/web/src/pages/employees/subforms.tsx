import { ChangeEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "../../api/client";
import { Modal, Field } from "./components";
import {
  DOC_TYPES,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
  MARITAL_STATUSES,
  type EmployeeDetail,
} from "./types";

function useInvalidate(id: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["employee", id] });
    qc.invalidateQueries({ queryKey: ["employees"] });
  };
}

function useFormState<T extends Record<string, string>>(initial: T) {
  const [form, setForm] = useState<T>(initial);
  function field(key: keyof T) {
    return {
      value: form[key] as string,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value as never })),
    };
  }
  return { form, setForm, field };
}

export function AddContactModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const invalidate = useInvalidate(employeeId);
  const [error, setError] = useState("");
  const { form, field } = useFormState({ name: "", relationship: "", phone: "" });
  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post(`/employees/${employeeId}/emergency-contacts`, payload)).data,
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });
  return (
    <Modal title="Add emergency contact" onClose={onClose}>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
        className="space-y-4"
      >
        <Field label="Name">
          <input className="input" required {...field("name")} />
        </Field>
        <Field label="Relationship">
          <input className="input" required placeholder="e.g. Spouse, Parent" {...field("relationship")} />
        </Field>
        <Field label="Phone">
          <input className="input" required {...field("phone")} />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddSkillModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const invalidate = useInvalidate(employeeId);
  const [error, setError] = useState("");
  const { form, field } = useFormState({ skill: "", level: "" });
  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post(`/employees/${employeeId}/skills`, payload)).data,
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });
  return (
    <Modal title="Add skill" onClose={onClose}>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ skill: form.skill, level: form.level || undefined });
        }}
        className="space-y-4"
      >
        <Field label="Skill">
          <input className="input" required placeholder="e.g. TypeScript, React" {...field("skill")} />
        </Field>
        <Field label="Level (optional)">
          <input className="input" placeholder="e.g. Beginner, Intermediate, Expert" {...field("level")} />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddQualificationModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const invalidate = useInvalidate(employeeId);
  const [error, setError] = useState("");
  const { form, field } = useFormState({ degree: "", institution: "", year: "" });
  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post(`/employees/${employeeId}/qualifications`, payload)).data,
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });
  return (
    <Modal title="Add qualification" onClose={onClose}>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
            degree: form.degree,
            institution: form.institution,
            year: form.year ? Number(form.year) : undefined,
          });
        }}
        className="space-y-4"
      >
        <Field label="Degree">
          <input className="input" required placeholder="e.g. B.Sc. Computer Science" {...field("degree")} />
        </Field>
        <Field label="Institution">
          <input className="input" required {...field("institution")} />
        </Field>
        <Field label="Year (optional)">
          <input className="input" {...field("year")} />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddCertificationModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const invalidate = useInvalidate(employeeId);
  const [error, setError] = useState("");
  const { form, field } = useFormState({ name: "", issuer: "", validUntil: "" });
  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post(`/employees/${employeeId}/certifications`, payload)).data,
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });
  return (
    <Modal title="Add certification" onClose={onClose}>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
            name: form.name,
            issuer: form.issuer || undefined,
            validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
          });
        }}
        className="space-y-4"
      >
        <Field label="Certification name">
          <input className="input" required {...field("name")} />
        </Field>
        <Field label="Issuer (optional)">
          <input className="input" {...field("issuer")} />
        </Field>
        <Field label="Valid until (optional)">
          <input className="input" type="date" {...field("validUntil")} />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddEmploymentHistoryModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const invalidate = useInvalidate(employeeId);
  const [error, setError] = useState("");
  const { form, field } = useFormState({ company: "", role: "", startDate: "", endDate: "" });
  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post(`/employees/${employeeId}/employment-history`, payload)).data,
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });
  return (
    <Modal title="Add employment history" onClose={onClose}>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
            company: form.company,
            role: form.role,
            startDate: new Date(form.startDate).toISOString(),
            endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
          });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company">
            <input className="input" required {...field("company")} />
          </Field>
          <Field label="Role">
            <input className="input" required {...field("role")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date">
            <input className="input" type="date" required {...field("startDate")} />
          </Field>
          <Field label="End date (optional)">
            <input className="input" type="date" {...field("endDate")} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddDocumentModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const invalidate = useInvalidate(employeeId);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("other");
  const [expiresAt, setExpiresAt] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please choose a file");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
      fd.append("docType", docType);
      if (expiresAt) fd.append("expiresAt", new Date(expiresAt).toISOString());
      return (await api.post(`/employees/${employeeId}/documents/upload`, fd)).data;
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });

  return (
    <Modal title="Upload document" onClose={onClose}>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <Field label="File">
          <input
            type="file"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </Field>
        <Field label="Title">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expires (optional)">
            <input className="input" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={mutation.isPending || !file}>
            {mutation.isPending ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditEmployeeModal({ detail, onClose }: { detail: EmployeeDetail; onClose: () => void }) {
  const invalidate = useInvalidate(detail.id);
  const [error, setError] = useState("");
  const { form, setForm, field } = useFormState({
    firstName: detail.firstName,
    lastName: detail.lastName,
    email: detail.email,
    phone: detail.phone ?? "",
    gender: detail.gender ?? "",
    dateOfBirth: detail.dateOfBirth ? detail.dateOfBirth.slice(0, 10) : "",
    dateOfJoining: detail.dateOfJoining ? detail.dateOfJoining.slice(0, 10) : "",
    employmentType: detail.employmentType ?? "",
    employmentStatus: detail.employmentStatus,
    maritalStatus: detail.maritalStatus ?? "",
    address: detail.address ?? "",
    designationId: detail.designationId ?? "",
    departmentId: detail.departmentId ?? "",
    reportingManagerId: detail.reportingManagerId ?? "",
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get("/organization/departments")).data.data as { id: string; name: string }[],
  });
  const designationsQuery = useQuery({
    queryKey: ["designations"],
    queryFn: async () => (await api.get("/organization/designations")).data.data as { id: string; title: string }[],
  });
  const managersQuery = useQuery({
    queryKey: ["employees", "directory"],
    queryFn: async () =>
      (await api.get(`/employees/directory`)).data.data as { id: string; firstName: string; lastName: string }[],
  });

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.patch(`/employees/${detail.id}`, payload)).data,
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });

  const managers = (managersQuery.data ?? []).filter((m) => m.id !== detail.id);

  return (
    <Modal title="Edit employee" onClose={onClose} wide>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone || undefined,
            gender: form.gender || undefined,
            maritalStatus: form.maritalStatus || undefined,
            address: form.address || undefined,
            employmentType: form.employmentType || undefined,
            employmentStatus: form.employmentStatus || undefined,
            designationId: form.designationId || undefined,
            departmentId: form.departmentId || undefined,
            reportingManagerId: form.reportingManagerId || undefined,
            dateOfJoining: form.dateOfJoining ? new Date(form.dateOfJoining).toISOString() : undefined,
            dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
          });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name">
            <input className="input" required {...field("firstName")} />
          </Field>
          <Field label="Last name">
            <input className="input" required {...field("lastName")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input className="input" type="email" required {...field("email")} />
          </Field>
          <Field label="Phone">
            <input className="input" {...field("phone")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gender">
            <select className="input" {...field("gender")}>
              <option value="">No gender</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Marital status">
            <select className="input" {...field("maritalStatus")}>
              <option value="">No marital status</option>
              {MARITAL_STATUSES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of birth">
            <input className="input" type="date" {...field("dateOfBirth")} />
          </Field>
          <Field label="Date of joining">
            <input className="input" type="date" {...field("dateOfJoining")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employment type">
            <select className="input" {...field("employmentType")}>
              <option value="">No type</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Employment status">
            <select className="input" {...field("employmentStatus")}>
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Department">
          <select className="input" value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
            <option value="">No department</option>
            {(departmentsQuery.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Designation">
            <select className="input" value={form.designationId} onChange={(e) => setForm((f) => ({ ...f, designationId: e.target.value }))}>
              <option value="">No designation</option>
              {(designationsQuery.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Reporting manager">
            <select className="input" value={form.reportingManagerId} onChange={(e) => setForm((f) => ({ ...f, reportingManagerId: e.target.value }))}>
              <option value="">No manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Address">
          <textarea className="input" rows={2} {...(field("address") as any)} />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
