import { ReactNode } from "react";
import clsx from "clsx";

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12">
      <div className={clsx("w-full rounded-lg bg-white shadow-xl dark:bg-neutral-900 dark:text-neutral-100", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300">
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-neutral-100">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function InfoItem({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-400 dark:text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm text-gray-800 dark:text-neutral-100">{value ?? "—"}</div>
    </div>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
