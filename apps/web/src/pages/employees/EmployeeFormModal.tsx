import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "../../api/client";

interface OrgOption {
  id: string;
  name: string;
}

export function EmployeeFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employmentType: "permanent",
    dateOfJoining: "",
    companyId: "",
    departmentId: "",
  });

  const companiesQuery = useQuery({
    queryKey: ["companies"],
    queryFn: async () => (await api.get("/organization/companies")).data.data as OrgOption[],
  });
  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await api.get("/organization/departments")).data.data as OrgOption[],
  });

  const mutation = useMutation({
    mutationFn: async (payload: unknown) => (await api.post("/employees", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (err) => setError(extractError(err)),
  });

  useEffect(() => {
    if (companiesQuery.data && companiesQuery.data.length > 0 && !form.companyId) {
      setForm((f) => ({ ...f, companyId: companiesQuery.data[0].id }));
    }
  }, [companiesQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({
      ...form,
      dateOfJoining: form.dateOfJoining ? new Date(form.dateOfJoining).toISOString() : undefined,
      departmentId: form.departmentId || undefined,
    });
  }

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value as never })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-900">New Employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First name</label>
              <input className="input" required {...field("firstName")} />
            </div>
            <div>
              <label className="label">Last name</label>
              <input className="input" required {...field("lastName")} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required {...field("email")} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...field("phone")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Employment type</label>
              <select className="input" {...field("employmentType")}>
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="probation">Probation</option>
              </select>
            </div>
            <div>
              <label className="label">Date of joining</label>
              <input className="input" type="date" {...field("dateOfJoining")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Company</label>
              <select className="input" required {...field("companyId")}>
                {(companiesQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" {...field("departmentId")}>
                <option value="">No department</option>
                {(departmentsQuery.data ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
