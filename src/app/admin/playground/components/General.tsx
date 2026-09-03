"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Status = "active" | "inactive" | "draft";

interface PageSize {
  width: number;
  height: number;
  units: "pt";
}

interface FormState {
  displayName: string;
  code: string;
  certPrefix: string;
  description: string;
  status: Status;
  templateFile: File | null;
  templateFileName: string;
  pageIndex: number;
  pageCount: number;
  pageSize: PageSize | null;
}

interface FormErrors {
  displayName?: string;
  code?: string;
  certPrefix?: string;
  templateFile?: string;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];

const CODE_PATTERN = /^[A-Z0-9-]+$/;

async function inspectPdf(file: File): Promise<{ pageSize: PageSize; pageCount: number }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let raw = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    raw += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  const mediaBoxMatch = raw.match(
    /\/MediaBox\s*\[\s*([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s*\]/
  );

  let pageSize: PageSize = { width: 612, height: 792, units: "pt" };
  if (mediaBoxMatch) {
    const [, x0, y0, x1, y1] = mediaBoxMatch.map(Number) as unknown as number[];
    pageSize = {
      width: Math.round(Math.abs(x1 - x0)),
      height: Math.round(Math.abs(y1 - y0)),
      units: "pt",
    };
  }

  const pageMatches = raw.match(/\/Type\s*\/Page(?!s)/g);
  const pageCount = pageMatches?.length ?? 1;

  return { pageSize, pageCount };
}

export default function General() {
  const [form, setForm] = useState<FormState>({
    displayName: "",
    code: "",
    certPrefix: "",
    description: "",
    status: "active",
    templateFile: null,
    templateFileName: "",
    pageIndex: 0,
    pageCount: 1,
    pageSize: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [pageIndexDropdownOpen, setPageIndexDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meta = {
    createdBy: "Director-General",
    createdOn: "May 24, 2025 10:30 AM",
    lastUpdated: "May 24, 2025 10:30 AM",
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleFile = useCallback(async (file: File | undefined | null) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, templateFile: "Only PDF files are supported." }));
      return;
    }

    setErrors((prev) => ({ ...prev, templateFile: undefined }));
    setIsInspecting(true);

    try {
      const { pageSize, pageCount } = await inspectPdf(file);
      setForm((prev) => ({
        ...prev,
        templateFile: file,
        templateFileName: file.name,
        pageSize,
        pageCount,
        pageIndex: 0,
      }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        templateFile: "Couldn't read that PDF. Try a different file.",
      }));
    } finally {
      setIsInspecting(false);
      setSaved(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile]
  );

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!form.displayName.trim()) {
      next.displayName = "Display name is required.";
    }

    if (!form.code.trim()) {
      next.code = "Code is required.";
    } else if (!CODE_PATTERN.test(form.code.trim())) {
      next.code = "Use uppercase letters, numbers, and hyphens only.";
    }

    if (!form.certPrefix.trim()) {
      next.certPrefix = "Certificate number prefix is required.";
    }

    if (!form.templateFile && !form.templateFileName) {
      next.templateFile = "Upload a PDF template.";
    }

    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 text-[#1a2236]"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic information */}
        <section className="rounded-lg border border-[#dde3ee] bg-white p-6 shadow-sm">
          <h2 className="text-[17px] font-semibold text-[#1a2236]">Basic Information</h2>

          <div className="mt-5 space-y-5">
            <Field label="Display Name" required error={errors.displayName}>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
                placeholder="Certificate of Origin"
                className={inputClass(!!errors.displayName)}
              />
            </Field>

            <Field
              label="Code"
              required
              error={errors.code}
              hint="Uppercase letters, numbers, and hyphens"
            >
              <input
                type="text"
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                placeholder="NACC-CO"
                className={inputClass(!!errors.code)}
              />
            </Field>

            <Field label="Certificate Number Prefix" required error={errors.certPrefix}>
              <input
                type="text"
                value={form.certPrefix}
                onChange={(e) => setField("certPrefix", e.target.value)}
                placeholder="CO/"
                className={inputClass(!!errors.certPrefix)}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="What is this certificate used for?"
                rows={4}
                className={`${inputClass(false)} resize-y`}
              />
            </Field>

            <Field label="Status">
              <Dropdown
                value={form.status}
                onChange={(value) => setField("status", value as Status)}
                options={STATUS_OPTIONS}
                isOpen={statusDropdownOpen}
                onToggle={() => setStatusDropdownOpen(!statusDropdownOpen)}
                onClose={() => setStatusDropdownOpen(false)}
              />
            </Field>
          </div>
        </section>

        {/* Template information */}
        <section className="rounded-lg border border-[#dde3ee] bg-white p-6 shadow-sm">
          <h2 className="text-[14px] font-semibold text-[#1a2236]">Template Information</h2>

          <div className="mt-5 space-y-5">
            <Field label="Template File (PDF only)" required error={errors.templateFile}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  isDragging
                    ? "border-[#1a4a8a] bg-[#e8f0fe]"
                    : errors.templateFile
                    ? "border-red-300 bg-white"
                    : "border-[#d1d5db] bg-white"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2 text-sm text-[#4a5a7a]">
                  <DocIcon />
                  <span className="truncate">
                    {form.templateFileName || "No file selected"}
                  </span>
                  {isInspecting && (
                    <span className="text-xs text-[#9ca3af]">Reading…</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 rounded-lg border border-[#1a4a8a] bg-[#e8f0fe] px-3 py-1.5 text-sm font-medium text-[#1a4a8a] hover:bg-[#d4e6fd]"
                >
                  {form.templateFileName ? "Change Template" : "Upload Template"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            </Field>

            <Field label="Page Index">
              <Dropdown
                value={form.pageIndex}
                onChange={(value) => setField("pageIndex", Number(value))}
                options={Array.from({ length: Math.max(form.pageCount, 1) }, (_, i) => ({
                  value: i,
                  label: `${i} ${i === 0 ? "(First Page)" : ""}`
                }))}
                isOpen={pageIndexDropdownOpen}
                onToggle={() => setPageIndexDropdownOpen(!pageIndexDropdownOpen)}
                onClose={() => setPageIndexDropdownOpen(false)}
                disabled={!form.templateFileName}
              />
            </Field>

            <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <p className="text-sm font-medium text-purple-600">Detected Page Size</p>
              {form.pageSize ? (
                <dl className="mt-2 space-y-1 text-sm text-[#4a5a7a]">
                  <div className="flex gap-1.5">
                    <dt className="text-[#9ca3af]">Width:</dt>
                    <dd>{form.pageSize.width} pt</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-[#9ca3af]">Height:</dt>
                    <dd>{form.pageSize.height} pt</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-[#9ca3af]">Units:</dt>
                    <dd>Points (pt)</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-[#9ca3af]">
                  Upload a template to detect its page size.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Meta footer */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-[#dde3ee] bg-[#f9fafb] p-5 text-sm sm:grid-cols-3">
        <div>
          <p className="text-[#9ca3af]">Created By</p>
          <p className="mt-1 font-medium text-[#1a2236]">{meta.createdBy}</p>
        </div>
        <div>
          <p className="text-[#9ca3af]">Created On</p>
          <p className="mt-1 font-medium text-[#1a2236]">{meta.createdOn}</p>
        </div>
        <div>
          <p className="text-[#9ca3af]">Last Updated</p>
          <p className="mt-1 font-medium text-[#1a2236]">{meta.lastUpdated}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm font-medium text-[#1f8a44]">Saved</span>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-[#1a4a8a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#1a2236]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[#9ca3af]">{hint}</p>
      ) : null}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2.5 text-sm text-[#1a2236] placeholder:text-[#9ca3af] outline-none transition-colors focus:ring-2 focus:ring-[#e8f0fe] ${
    hasError
      ? "border-red-300 focus:border-red-400"
      : "border-[#d1d5db] focus:border-[#1a4a8a]"
  }`;
}

function DocIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#9ca3af]"
    >
      <path
        d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Dropdown<T extends string | number>({
  value,
  onChange,
  options,
  isOpen,
  onToggle,
  onClose,
  disabled = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[#1a2236] outline-none transition-colors flex items-center justify-between ${
          disabled
            ? "border-[#d1d5db] bg-[#f9fafb] text-[#9ca3af] cursor-not-allowed"
            : "border-[#d1d5db] hover:border-[#1a4a8a] focus:border-[#1a4a8a]"
        }`}
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        {!disabled && (isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
      </button>

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={onClose}
          />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#d1d5db] bg-white shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  onClose();
                }}
                className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${
                  option.value === value
                    ? "bg-[#e8f0fe] text-[#1a4a8a]"
                    : "text-[#1a2236] hover:bg-[#f9fafb]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}