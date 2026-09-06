"use client";

import { useMemo, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Info, ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch, getBaseUrl } from "@/utils/api";

type NumberingMethod = string;
type Padding = 4 | 6 | 8 | 10;
type ResetFrequency = "never" | "yearly" | "monthly" | "daily";

interface NumberingMethodOption {
  code: string;
  name: string;
}

interface NumberingConfig {
  method: string;
  padding: number;
  incrementStep: number;
  resetFrequency: string;
  separator: string;
  format: string;
}

interface NumberingState {
  method: NumberingMethod;
  prefix: string;
  currentNumber: string;
  padding: Padding;
  incrementStep: number;
  resetFrequency: ResetFrequency;
  includePrefix: boolean;
  useYear: boolean;
  useMonth: boolean;
  useDay: boolean;
  useHour: boolean;
  useMinute: boolean;
  resetAnnually: boolean;
  allowManualOverride: boolean;
  separator: string;
  format: string;
}

const PADDING_OPTIONS: { value: Padding; label: string }[] = [
  { value: 4, label: "4 Digits (0000)" },
  { value: 6, label: "6 Digits (000000)" },
  { value: 8, label: "8 Digits (00000000)" },
  { value: 10, label: "10 Digits (0000000000)" },
];

const RESET_OPTIONS: { value: ResetFrequency; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "yearly", label: "Yearly" },
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
];

const STEP_OPTIONS = [1, 2, 5, 10];

function buildFormat(state: NumberingState): string {
  const tokens = [
    state.includePrefix && "{PREFIX}",
    state.useYear && "{YEAR}",
    state.useDay && "{DAY}",
    state.useMonth && "{MONTH}",
    state.useHour && "{HOUR}",
    state.useMinute && "{MIN}",
    "{SEQUENCE}",
  ].filter((token): token is string => Boolean(token));

  return tokens.join(state.separator);
}

function formatCertificateNumber(state: NumberingState, numericValue: number): string {
  const now = new Date();
  const padded = String(numericValue).padStart(state.padding, "0");
  // Prefixes such as "CO/" are already common in the existing data. Avoid
  // duplicating the separator when a date/time token follows the prefix.
  const prefix = state.separator && state.prefix.endsWith(state.separator)
    ? state.prefix.slice(0, -state.separator.length)
    : state.prefix;
  const replacements: Record<string, string> = {
    "{PREFIX}": prefix,
    "{YEAR}": String(now.getFullYear()),
    "{DAY}": String(now.getDate()).padStart(2, "0"),
    "{MONTH}": String(now.getMonth() + 1).padStart(2, "0"),
    "{HOUR}": String(now.getHours()).padStart(2, "0"),
    "{MIN}": String(now.getMinutes()).padStart(2, "0"),
    "{SEQUENCE}": padded,
  };

  return buildFormat(state).replace(/\{PREFIX\}|\{YEAR\}|\{DAY\}|\{MONTH\}|\{HOUR\}|\{MIN\}|\{SEQUENCE\}/g, (token) => replacements[token]);
}

function Select<T extends string | number>({
  value,
  onChange,
  options,
  disabled,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${className} flex items-center justify-between ${disabled ? 'cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8]' : ''}`}
      >
        <span>{selectedOption?.label || value}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#cbd5e1] bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#f1f5f9] ${
                opt.value === value ? 'bg-[#e8f0fe] text-[#1a4a8a] font-semibold' : 'text-[#1e293b]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MemberingFormatProps {
  certificateType?: {
    id: string;
    code: string;
    numberingConfig?: NumberingConfig;
  } | null;
  onTabChange?: (tabId: string) => void;
}

export interface MemberingFormatData {
  numberingConfig: NumberingConfig;
}

export interface MemberingFormatRef {
  getData: () => MemberingFormatData;
}

const CertificateNumberingPanel = forwardRef<MemberingFormatRef, MemberingFormatProps>(({ certificateType, onTabChange }, ref) => {
  const [numberingMethods, setNumberingMethods] = useState<NumberingMethodOption[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  
  const [state, setState] = useState<NumberingState>({
    method: "AUTO_INCREMENT",
    prefix: "CO/",
    currentNumber: "00001234",
    padding: 8,
    incrementStep: 1,
    resetFrequency: "never",
    includePrefix: true,
    useYear: false,
    useMonth: false,
    useDay: false,
    useHour: false,
    useMinute: false,
    resetAnnually: false,
    allowManualOverride: false,
    separator: "",
    format: "{PREFIX}{SEQUENCE}",
  });

  // Load numbering config from certificate type
  useEffect(() => {
    if (certificateType?.numberingConfig) {
      const config = certificateType.numberingConfig;
      setState((prev) => ({
        ...prev,
        method: config.method || prev.method,
        padding: config.padding as Padding || prev.padding,
        incrementStep: config.incrementStep || prev.incrementStep,
        resetFrequency: config.resetFrequency.toLowerCase() as ResetFrequency || prev.resetFrequency,
        separator: config.separator || "",
        format: config.format || prev.format,
        includePrefix: config.format?.includes("{PREFIX}") ?? prev.includePrefix,
        useYear: config.format?.includes("{YEAR}") ?? prev.useYear,
        useDay: config.format?.includes("{DAY}") ?? prev.useDay,
        useMonth: config.format?.includes("{MONTH}") ?? prev.useMonth,
        useHour: config.format?.includes("{HOUR}") ?? prev.useHour,
        useMinute: config.format?.includes("{MIN}") ?? prev.useMinute,
      }));
    }
  }, [certificateType?.numberingConfig]);

  // Fetch numbering methods from API
  useEffect(() => {
    const fetchNumberingMethods = async () => {
      try {
        const baseUrl = getBaseUrl();
        const response = await apiFetch(`${baseUrl}/api/v1/certificates/reference/numbering-methods`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setNumberingMethods(data.data);
          // Set default method to first available if not already set
          if (data.data.length > 0 && !certificateType?.numberingConfig) {
            setState((prev) => ({ ...prev, method: data.data[0].code }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch numbering methods:', error);
        // Keep using fallback methods
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchNumberingMethods();
  }, [certificateType?.numberingConfig]);

  // Expose data via ref
  useImperativeHandle(ref, () => ({
    getData: () => ({
      numberingConfig: {
        method: state.method,
        padding: state.padding,
        incrementStep: state.incrementStep,
        resetFrequency: state.resetFrequency,
        separator: state.separator,
        format: buildFormat(state),
      },
    }),
  }));

  const update = <K extends keyof NumberingState>(key: K, value: NumberingState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const updateTimeToken = (
    key: "useYear" | "useMonth" | "useDay" | "useHour" | "useMinute",
    enabled: boolean
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: enabled,
      // Use the API's conventional delimiter for newly selected date/time
      // tokens, while still respecting a separator the admin explicitly chose.
      separator: enabled && !prev.separator ? "/" : prev.separator,
    }));
  };

  const numberingFormat = useMemo(() => buildFormat(state), [state]);

  const baseNumeric = useMemo(() => {
    const parsed = parseInt(state.currentNumber.replace(/\D/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [state.currentNumber]);

  const preview = useMemo(
    () => formatCertificateNumber(state, baseNumeric),
    [state, baseNumeric]
  );

  const sampleNumbers = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) =>
        formatCertificateNumber(state, baseNumeric + i * state.incrementStep)
      ),
    [state, baseNumeric]
  );

  return (
    <div className="h-full flex flex-col text-slate-900">
      <div className="rounded border border-[#e2e8f0] bg-white p-6 shadow-lg flex-1 flex flex-col">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Certificate Numbering */}
          <section className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-bold text-[#1a4a8a]">
              Certificate Numbering
            </h2>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
            <Field label="Numbering Method" required>
              <Select
                value={state.method}
                onChange={(v) => update("method", v as NumberingMethod)}
                options={numberingMethods.length > 0 
                  ? numberingMethods.map((m) => ({ value: m.code, label: m.name }))
                  : [{ value: "AUTO_INCREMENT", label: "Auto Increment" }]
                }
                className={selectClass}
                disabled={loadingMethods}
              />
            </Field>

            <Field label="Prefix" required>
              <input
                type="text"
                value={state.prefix}
                onChange={(e) => update("prefix", e.target.value)}
                placeholder="CO/"
                className={inputClass}
              />
            </Field>

            <Field label="Separator">
              <input
                type="text"
                value={state.separator}
                onChange={(e) => update("separator", e.target.value)}
                placeholder="-"
                className={inputClass}
              />
            </Field>

            <Field label="Format Pattern">
              <input
                type="text"
                value={numberingFormat}
                readOnly
                aria-label="Generated numbering format"
                className={`${inputClass} cursor-default bg-[#f8fafc]`}
              />
              <p className="mt-1 text-xs text-[#64748b]">Generated from the settings below.</p>
            </Field>

            <Field label="Current Number" required hint="The next number to be issued.">
              <input
                type="text"
                inputMode="numeric"
                value={state.currentNumber}
                onChange={(e) => update("currentNumber", e.target.value)}
                placeholder="00001234"
                className={inputClass}
              />
            </Field>

            <Field label="Number Padding" required>
              <Select
                value={state.padding}
                onChange={(v) => update("padding", v as Padding)}
                options={PADDING_OPTIONS}
                className={selectClass}
              />
            </Field>

            <Field label="Increment Step">
              <Select
                value={state.incrementStep}
                onChange={(v) => update("incrementStep", v)}
                options={STEP_OPTIONS.map((step) => ({ value: step, label: String(step) }))}
                className={selectClass}
                disabled={state.method !== "auto"}
              />
            </Field>

            <Field label="Reset Frequency">
              <Select
                value={state.resetFrequency}
                onChange={(v) => update("resetFrequency", v as ResetFrequency)}
                options={RESET_OPTIONS}
                className={selectClass}
              />
            </Field>
          </div>

          <hr className="my-6 border-[#e2e8f0]" />

          <h3 className="text-sm font-semibold text-[#1e293b]">
            Additional Settings
          </h3>

          <div className="mt-4 space-y-3">
            <Checkbox
              checked={state.includePrefix}
              onChange={(v) => update("includePrefix", v)}
              label="Include Prefix in Certificate Number"
            />
            <Checkbox
              checked={state.useYear}
              onChange={(v) => updateTimeToken("useYear", v)}
              label="Use Year in Numbering"
            />
            <Checkbox
              checked={state.useMonth}
              onChange={(v) => updateTimeToken("useMonth", v)}
              label="Use Month in Numbering"
            />
            <Checkbox
              checked={state.useDay}
              onChange={(v) => updateTimeToken("useDay", v)}
              label="Use Day in Numbering"
            />
            <Checkbox
              checked={state.useHour}
              onChange={(v) => updateTimeToken("useHour", v)}
              label="Use Hour in Numbering"
            />
            <Checkbox
              checked={state.useMinute}
              onChange={(v) => updateTimeToken("useMinute", v)}
              label="Use Minute in Numbering"
            />
            <Checkbox
              checked={state.resetAnnually}
              onChange={(v) => {
                update("resetAnnually", v);
                if (v) update("resetFrequency", "yearly");
              }}
              label="Reset Annually"
            />
            <Checkbox
              checked={state.allowManualOverride}
              onChange={(v) => update("allowManualOverride", v)}
              label="Allow Manual Override (for staff)"
              info="Staff will be able to manually set a certificate number instead of using the generated one."
            />
          </div>
        </section>

          {/* Number Preview */}
          <section className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-bold text-[#1a4a8a]">
              Number Preview
            </h2>

            <p className="mt-5 text-sm font-semibold text-[#64748b]">Live Preview</p>
            <div className="mt-2 rounded-lg bg-green-100 border border-[#bfdbfe] py-4 text-center">
              <span className="text-2xl font-semibold tracking-wide text-green-600">
                {preview}
              </span>
            </div>

            <p className="mt-6 text-sm font-semibold text-[#64748b]">
              Sample Next Numbers
            </p>
            <div className="mt-2 space-y-2">
              {sampleNumbers.map((num, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[#e2e8f0] text-sm"
                >
                  <span className="flex h-8 w-8 py-6 px-6 items-center justify-center rounded-md bg-[#f1f5f9] text-[14px] font-semibold text-[#64748b]">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-[#334155] pr-4">{num}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1a4a8a]" />
              <p className="text-sm text-[#1e3a5f]">
                The next certificate issued will be{" "}
                <span className="font-semibold text-[#1a4a8a]">{preview}</span>
              </p>
            </div>
          </section>
        </div>

        {/* Footer / pagination */}
        <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-4 py-6 text-sm text-[#64748b]">
            <span>Page 1 of 1</span>
            <span className="text-[#cbd5e1]">|</span>
            <span>Current Number: {state.currentNumber}</span>
            <span className="text-[#cbd5e1]">|</span>
            <span>Next Number: {preview}</span>
          </div>
          <div className="flex gap-2 py-8">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold text-[#94a3b8] hover:bg-[#f1f5f9] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.('Fee')}
              className="flex items-center gap-1 rounded-lg bg-[#1a4a8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a5a9a] transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CertificateNumberingPanel.displayName = 'CertificateNumberingPanel';

export default CertificateNumberingPanel;

const inputClass =
  "w-full rounded-lg border border-[#cbd5e1] px-3 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none transition-colors focus:border-[#1a4a8a] focus:ring-2 focus:ring-[#1a4a8a]/20";

const selectClass = `${inputClass} disabled:cursor-not-allowed disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]`;

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#334155]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[#94a3b8]">{hint}</p>}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  info,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  info?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#334155]">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
          checked
            ? "bg-[#1a4a8a] shadow-md"
            : "border border-[#cbd5e1] bg-white"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </button>
      <span>{label}</span>
      {info && (
        <span title={info} className="cursor-help text-[#94a3b8]">
          <Info className="h-3.5 w-3.5" />
        </span>
      )}
    </label>
  );
}
