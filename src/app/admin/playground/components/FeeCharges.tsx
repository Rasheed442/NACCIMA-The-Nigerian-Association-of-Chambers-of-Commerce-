"use client";

import { useMemo, useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

type CalcMethod = "percentage" | "fixed";
type Rounding = "none" | "2dp" | "whole" | "nearest10" | "nearest50" | "nearest100";

interface FeeState {
  method: CalcMethod;
  memberRate: string;
  nonMemberRate: string;
  vatRate: string;
  currency: string;
  minFee: string;
  maxFee: string;
  rounding: Rounding;
}

const CURRENCIES = [
  { value: "NGN", label: "NGN - Nigerian Naira" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "EUR", label: "EUR - Euro" },
];

const ROUNDING_OPTIONS: { value: Rounding; label: string }[] = [
  { value: "none", label: "No Rounding" },
  { value: "2dp", label: "Round to 2 decimal places" },
  { value: "whole", label: "Round to nearest whole number" },
  { value: "nearest10", label: "Round to nearest 10" },
  { value: "nearest50", label: "Round to nearest 50" },
  { value: "nearest100", label: "Round to nearest 100" },
];

const SAMPLE_FOB_VALUE = 10000; // USD, used purely for the illustrative preview

function applyRounding(value: number, rounding: Rounding): number {
  switch (rounding) {
    case "2dp":
      return Math.round(value * 100) / 100;
    case "whole":
      return Math.round(value);
    case "nearest10":
      return Math.round(value / 10) * 10;
    case "nearest50":
      return Math.round(value / 50) * 50;
    case "nearest100":
      return Math.round(value / 100) * 100;
    default:
      return value;
  }
}

function clampToLimits(value: number, min: string, max: string): number {
  let result = value;
  const minNum = parseFloat(min);
  const maxNum = parseFloat(max);
  if (!Number.isNaN(minNum) && minNum > 0) result = Math.max(result, minNum);
  if (!Number.isNaN(maxNum) && maxNum > 0) result = Math.min(result, maxNum);
  return result;
}

function formatCurrency(value: number, currency: string): string {
  if (!Number.isFinite(value)) return `${currency} 0.00`;
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
        className={`${className} flex items-center justify-between ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
      >
        <span>{selectedOption?.label || value}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                opt.value === value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
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

export default function FeeStructurePanel() {
  const [state, setState] = useState<FeeState>({
    method: "percentage",
    memberRate: "0.11",
    nonMemberRate: "0.125",
    vatRate: "7.50",
    currency: "NGN",
    minFee: "0.00",
    maxFee: "0.00",
    rounding: "2dp",
  });

  const update = <K extends keyof FeeState>(key: K, value: FeeState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const calc = useMemo(() => {
    const memberRate = parseFloat(state.memberRate) || 0;
    const nonMemberRate = parseFloat(state.nonMemberRate) || 0;
    const vatRate = parseFloat(state.vatRate) || 0;

    const baseMemberFee =
      state.method === "percentage"
        ? SAMPLE_FOB_VALUE * (memberRate / 100)
        : memberRate;
    const baseNonMemberFee =
      state.method === "percentage"
        ? SAMPLE_FOB_VALUE * (nonMemberRate / 100)
        : nonMemberRate;

    const memberFee = clampToLimits(baseMemberFee, state.minFee, state.maxFee);
    const nonMemberFee = clampToLimits(baseNonMemberFee, state.minFee, state.maxFee);

    const memberVat = memberFee * (vatRate / 100);
    const nonMemberVat = nonMemberFee * (vatRate / 100);

    const totalMember = applyRounding(memberFee + memberVat, state.rounding);
    const totalNonMember = applyRounding(nonMemberFee + nonMemberVat, state.rounding);

    return {
      memberFee: applyRounding(memberFee, state.rounding),
      nonMemberFee: applyRounding(nonMemberFee, state.rounding),
      memberVat: applyRounding(memberVat, state.rounding),
      totalMember,
      totalNonMember,
    };
  }, [state]);

  return (
    <div className="space-y-4 p-6 text-slate-900">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fee Structure */}
        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Fee Structure
          </h2>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fee Calculation Method<span className="ml-0.5 text-red-500">*</span>
            </label>
            <div className="flex gap-8">
              <RadioOption
                label="Percentage of FOB Value"
                checked={state.method === "percentage"}
                onSelect={() => update("method", "percentage")}
              />
              <RadioOption
                label="Fixed Amount"
                checked={state.method === "fixed"}
                onSelect={() => update("method", "fixed")}
              />
            </div>
          </div>

          <hr className="my-6 border-slate-100" />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label={state.method === "percentage" ? "Member Rate (%)" : "Member Fee"}
              required
              hint="Applied to companies with active NACCIMA membership"
            >
              <input
                type="text"
                inputMode="decimal"
                value={state.memberRate}
                onChange={(e) => update("memberRate", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field
              label={
                state.method === "percentage"
                  ? "Non-Member Rate (%)"
                  : "Non-Member Fee"
              }
              required
              hint="Applied to companies without active membership"
            >
              <input
                type="text"
                inputMode="decimal"
                value={state.nonMemberRate}
                onChange={(e) => update("nonMemberRate", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <hr className="my-6 border-slate-100" />

          <div className="grid grid-cols-2 gap-4">
            <Field label="VAT Rate (%)" hint="Value Added Tax rate applied to the fee">
              <input
                type="text"
                inputMode="decimal"
                value={state.vatRate}
                onChange={(e) => update("vatRate", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Currency" required>
              <Select
                value={state.currency}
                onChange={(v) => update("currency", v)}
                options={CURRENCIES}
                className={inputClass}
              />
            </Field>
          </div>

          <hr className="my-6 border-slate-100" />

          <h3 className="text-sm font-semibold text-slate-900">
            Fee Limits (Optional)
          </h3>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <Field label={`Minimum Fee (${state.currency})`}>
              <input
                type="text"
                inputMode="decimal"
                value={state.minFee}
                onChange={(e) => update("minFee", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={`Maximum Fee (${state.currency})`}>
              <input
                type="text"
                inputMode="decimal"
                value={state.maxFee}
                onChange={(e) => update("maxFee", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Rounding">
              <Select
                value={state.rounding}
                onChange={(v) => update("rounding", v as Rounding)}
                options={ROUNDING_OPTIONS}
                className={inputClass}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Leave minimum or maximum fee empty for no limit.
          </p>
        </section>

        {/* Fee Summary */}
        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Fee Summary</h2>

          <div className="mt-5 rounded-lg bg-indigo-50/60 p-5">
            <p className="text-sm font-semibold text-indigo-600">
              Calculation Example
            </p>

            <div className="mt-3 rounded-lg bg-white px-4 py-3">
              <p className="text-sm text-slate-500">FOB Value (USD)</p>
              <p className="text-base font-semibold text-slate-800">
                {SAMPLE_FOB_VALUE.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <SummaryRow
                label={`For Member (${state.memberRate}${
                  state.method === "percentage" ? "%" : ""
                })`}
                value={formatCurrency(calc.memberFee, state.currency)}
              />
              <SummaryRow
                label={`For Non-Member (${state.nonMemberRate}${
                  state.method === "percentage" ? "%" : ""
                })`}
                value={formatCurrency(calc.nonMemberFee, state.currency)}
              />
              <SummaryRow
                label={`VAT (${state.vatRate}%) on Fee (Member)`}
                value={formatCurrency(calc.memberVat, state.currency)}
              />
            </dl>

            <hr className="my-4 border-indigo-100" />

            <dl className="space-y-2.5">
              <SummaryRow
                label="Total Payable (Member)"
                value={formatCurrency(calc.totalMember, state.currency)}
                emphasized
              />
              <SummaryRow
                label="Total Payable (Non-Member)"
                value={formatCurrency(calc.totalNonMember, state.currency)}
                emphasized
              />
            </dl>
          </div>

          <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Important</p>
              <p className="mt-1 text-sm text-amber-800/80">
                The applicable rate (Member or Non-Member) will be determined
                at the time of application submission based on the
                company&rsquo;s membership status.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <span className="text-sm text-slate-500">Page 1 of 1</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

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
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function RadioOption({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-2.5 text-sm text-slate-700"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          checked ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
        }`}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={emphasized ? "font-medium text-slate-700" : "text-slate-500"}>
        {label}
      </dt>
      <dd
        className={
          emphasized
            ? "font-semibold text-indigo-700"
            : "font-medium text-slate-700"
        }
      >
        {value}
      </dd>
    </div>
  );
}