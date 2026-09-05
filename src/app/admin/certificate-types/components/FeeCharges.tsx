"use client";

import { useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import {
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
} from "lucide-react";
import { apiFetch, getBaseUrl } from "@/utils/api";

type CalcMethod = "PERCENTAGE" | "FLAT" | "TIERED";
type Rounding = "none" | "2dp" | "whole" | "nearest10" | "nearest50" | "nearest100";

interface Tier {
  id: string;
  minFob: string;
  maxFob: string; // empty string = Unlimited
  memberRate: string;
  nonMemberRate: string;
}

interface FeeState {
  feeBasis: CalcMethod;
  memberRate: string;
  nonMemberRate: string;
  memberAmount: string;
  nonMemberAmount: string;
  vatRate: string;
  currency: string;
  processingFee: string;
  rounding: Rounding;
  tiers: Tier[];
}

export interface FeeChargesData {
  feeStructure: {
    feeBasis: CalcMethod;
    memberRate: string;
    nonMemberRate: string;
    memberAmount: string;
    nonMemberAmount: string;
    vatRate: string;
    currency: string;
    processingFee: string;
    rounding: Rounding;
    tiers: Tier[];
  };
}

export interface FeeChargesRef {
  getData: () => FeeChargesData;
}

interface FeeChargesProps {
  onTabChange?: (tabId: string) => void;
  onSubmit?: () => void;
  certificateType?: {
    id: string;
    code: string;
  } | null;
  mode?: 'create' | 'edit';
  getFormData?: () => any;
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

// USD-based sample rates, purely for the illustrative preview.
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1338.5865,
  GBP: 0.79,
  EUR: 0.92,
};
const EXCHANGE_RATE_TIMESTAMP = "Today, 10:30 AM";

const SAMPLE_FOB_VALUE = 12500; // USD, used purely for the illustrative preview

const DEFAULT_TIERS: Tier[] = [
  { id: "t1", minFob: "0.00", maxFob: "10000.00", memberRate: "0.110", nonMemberRate: "0.125" },
  { id: "t2", minFob: "10000.01", maxFob: "50000.00", memberRate: "0.100", nonMemberRate: "0.120" },
  { id: "t3", minFob: "50000.01", maxFob: "", memberRate: "0.090", nonMemberRate: "0.110" },
];

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

function formatCurrency(value: number, currency: string): string {
  if (!Number.isFinite(value)) return `${currency} 0.00`;
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatUsd(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return "0.00";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function findApplicableTier(tiers: Tier[], fobValue: number): Tier | null {
  return (
    tiers.find((t) => {
      const min = parseFloat(t.minFob) || 0;
      const max = t.maxFob.trim() === "" ? Infinity : parseFloat(t.maxFob);
      return fobValue >= min && fobValue <= max;
    }) || null
  );
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

const FeeStructurePanel = forwardRef<FeeChargesRef, FeeChargesProps>(({ onTabChange, onSubmit, certificateType, mode = 'create', getFormData }, ref) => {
  const [state, setState] = useState<FeeState>({
    feeBasis: "TIERED",
    memberRate: "0.0011",
    nonMemberRate: "0.00125",
    memberAmount: "40000",
    nonMemberAmount: "52000",
    vatRate: "0.075",
    currency: "NGN",
    processingFee: "0.00",
    rounding: "2dp",
    tiers: DEFAULT_TIERS,
  });
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [feeMethods, setFeeMethods] = useState<{ code: string; name: string }[]>([]);

  // Fetch fee calculation methods
  useEffect(() => {
    const fetchFeeMethods = async () => {
      try {
        const baseUrl = getBaseUrl();
        const response = await apiFetch(`${baseUrl}/api/v1/certificates/reference/fee-calculation-methods`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setFeeMethods(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch fee calculation methods:', error);
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchFeeMethods();
  }, []);

  // Fetch existing fee data in edit mode
  useEffect(() => {
    const fetchFeeData = async () => {
      if (mode === 'edit' && certificateType?.id) {
        try {
          const baseUrl = getBaseUrl();
          const response = await apiFetch(`${baseUrl}/api/v1/admin/certificate-types/${certificateType.id}/fee`);
          const data = await response.json();

          if (data.success && data.data) {
            const apiData = data.data;
            setState((prev) => ({
              ...prev,
              feeBasis: apiData.feeBasis || prev.feeBasis,
              memberRate: apiData.memberRate?.toString() || prev.memberRate,
              nonMemberRate: apiData.nonMemberRate?.toString() || prev.nonMemberRate,
              memberAmount: apiData.memberAmount?.toString() || prev.memberAmount,
              nonMemberAmount: apiData.nonMemberAmount?.toString() || prev.nonMemberAmount,
              vatRate: apiData.vatRate?.toString() || prev.vatRate,
              tiers: apiData.tiers?.map((t: any, i: number) => ({
                id: `tier-${i}`,
                minFob: t.minFob?.toString() || "0",
                maxFob: t.maxFob?.toString() || "",
                memberRate: t.memberRate?.toString() || "0",
                nonMemberRate: t.nonMemberRate?.toString() || "0",
              })) || prev.tiers,
            }));
          }
        } catch (error) {
          console.error('Failed to fetch fee data:', error);
        }
      }
    };

    fetchFeeData();
  }, [mode, certificateType?.id]);

  const update = <K extends keyof FeeState>(key: K, value: FeeState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const updateTier = (id: string, patch: Partial<Tier>) =>
    setState((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));

  const addTier = () => {
    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      minFob: "",
      maxFob: "",
      memberRate: "0.000",
      nonMemberRate: "0.000",
    };
    setState((prev) => ({ ...prev, tiers: [...prev.tiers, newTier] }));
    setEditingTierId(newTier.id);
  };

  const removeTier = (id: string) => {
    setState((prev) => ({ ...prev, tiers: prev.tiers.filter((t) => t.id !== id) }));
    if (editingTierId === id) setEditingTierId(null);
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called - mode:', mode, 'certificateType:', certificateType);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // In create mode, call the POST endpoint directly
      if (mode === 'create' || !certificateType?.id) {
        console.log('Creating new certificate type via POST endpoint');

        // Get form data from parent if available
        const formData = getFormData ? getFormData() : {};
        console.log('formData from parent:', formData);

        // Build the full payload for certificate type creation
        let payload: any = {
          code: formData.code,
          name: formData.name ,
          description: formData.description,
          active: formData.active !== undefined ? formData.active : true,
          applicableFields: formData.applicableFields,
          requiredDocuments: formData.requiredDocuments,
          feeStructure: JSON.stringify({
            type: state.feeBasis,
            memberRate: state.feeBasis === 'PERCENTAGE' ? parseFloat(state.memberRate) || 0 : null,
            nonMemberRate: state.feeBasis === 'PERCENTAGE' ? parseFloat(state.nonMemberRate) || 0 : null,
            memberAmount: state.feeBasis === 'FLAT' ? parseFloat(state.memberAmount) || 0 : null,
            nonMemberAmount: state.feeBasis === 'FLAT' ? parseFloat(state.nonMemberAmount) || 0 : null,
            vatRate: parseFloat(state.vatRate) || 0,
            tiers: state.feeBasis === 'TIERED' ? state.tiers.map((t) => ({
              minFob: parseFloat(t.minFob) || 0,
              maxFob: t.maxFob === '' ? null : parseFloat(t.maxFob) || null,
              memberRate: parseFloat(t.memberRate) || 0,
              nonMemberRate: parseFloat(t.nonMemberRate) || 0,
            })) : null,
          }),
          templateUrl: formData.templateUrl,
          certNumberPrefix: formData.certNumberPrefix,
          templateConfig: formData.templateConfig,
        };

        console.log('Payload to send:', payload);
        const baseUrl = getBaseUrl();
        const url = `${baseUrl}/api/v1/admin/certificate-types`;
        console.log('Calling POST endpoint:', url);
        const response = await apiFetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log('API response:', result);

        if (!response.ok || result.success === false) {
          const errorMessage = result.message || `Failed to create certificate type (Status: ${response.status})`;
          throw new Error(errorMessage);
        }

        console.log('Certificate type created successfully:', result);
        setSubmitError(null);
        setSubmitSuccess('Certificate type created successfully!');
        setTimeout(() => setSubmitSuccess(null), 5000);
        if (onSubmit) onSubmit();
        return;
      }

      // In edit mode, update only the fee structure using the correct endpoint
      console.log('Proceeding with edit mode API call');
      let payload: any = {
        feeBasis: state.feeBasis,
        vatRate: parseFloat(state.vatRate) || 0,
      };

      // Build payload based on fee basis
      if (state.feeBasis === 'PERCENTAGE') {
        payload.memberRate = parseFloat(state.memberRate) || 0;
        payload.nonMemberRate = parseFloat(state.nonMemberRate) || 0;
        payload.memberAmount = null;
        payload.nonMemberAmount = null;
      } else if (state.feeBasis === 'FLAT') {
        payload.memberAmount = parseFloat(state.memberAmount) || 0;
        payload.nonMemberAmount = parseFloat(state.nonMemberAmount) || 0;
        payload.memberRate = null;
        payload.nonMemberRate = null;
      } else if (state.feeBasis === 'TIERED') {
        payload.tiers = state.tiers.map((t) => ({
          minFob: parseFloat(t.minFob) || 0,
          maxFob: t.maxFob === '' ? null : parseFloat(t.maxFob) || null,
          memberRate: parseFloat(t.memberRate) || 0,
          nonMemberRate: parseFloat(t.nonMemberRate) || 0,
        }));
        payload.memberRate = null;
        payload.nonMemberRate = null;
        payload.memberAmount = null;
        payload.nonMemberAmount = null;
      }

      console.log('Payload to send:', payload);
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}/api/v1/admin/certificate-types/${certificateType.id}/fee`;
      console.log('Calling API endpoint:', url);
      const response = await apiFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update fee structure');
      }

      // Success
      console.log('Fee structure updated successfully:', result);
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Failed to submit fee structure:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to update fee structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expose data via ref
  useImperativeHandle(ref, () => ({
    getData: () => ({
      feeStructure: state,
    }),
  }));

  const exchangeRate = EXCHANGE_RATES[state.currency] ?? 1;
  const convertedFob = SAMPLE_FOB_VALUE * exchangeRate;

  const applicableTier = useMemo(
    () => (state.feeBasis === "TIERED" ? findApplicableTier(state.tiers, SAMPLE_FOB_VALUE) : null),
    [state.feeBasis, state.tiers]
  );

  const calc = useMemo(() => {
    const vatRate = parseFloat(state.vatRate) || 0;
    const processingFee = parseFloat(state.processingFee) || 0;

    let memberRatePct = 0;
    let nonMemberRatePct = 0;
    let memberFeeRaw: number;
    let nonMemberFeeRaw: number;

    if (state.feeBasis === "TIERED") {
      memberRatePct = parseFloat(applicableTier?.memberRate ?? "0") || 0;
      nonMemberRatePct = parseFloat(applicableTier?.nonMemberRate ?? "0") || 0;
      memberFeeRaw = convertedFob * memberRatePct;
      nonMemberFeeRaw = convertedFob * nonMemberRatePct;
    } else if (state.feeBasis === "PERCENTAGE") {
      memberRatePct = parseFloat(state.memberRate) || 0;
      nonMemberRatePct = parseFloat(state.nonMemberRate) || 0;
      memberFeeRaw = convertedFob * memberRatePct;
      nonMemberFeeRaw = convertedFob * nonMemberRatePct;
    } else {
      // FLAT amount, already denominated in the selected currency
      memberFeeRaw = parseFloat(state.memberAmount) || 0;
      nonMemberFeeRaw = parseFloat(state.nonMemberAmount) || 0;
    }

    const memberVat = memberFeeRaw * vatRate;
    const nonMemberVat = nonMemberFeeRaw * vatRate;

    const totalMember = applyRounding(memberFeeRaw + memberVat + processingFee, state.rounding);
    const totalNonMember = applyRounding(
      nonMemberFeeRaw + nonMemberVat + processingFee,
      state.rounding
    );

    return {
      memberRatePct,
      nonMemberRatePct,
      memberFee: applyRounding(memberFeeRaw, state.rounding),
      memberVat: applyRounding(memberVat, state.rounding),
      processingFee: applyRounding(processingFee, state.rounding),
      totalMember,
      totalNonMember,
    };
  }, [state, applicableTier, convertedFob]);

  return (
    <div className="space-y-4 p-6 text-slate-900">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fee Structure */}
        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Fee Structure</h2>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fee Calculation Method<span className="ml-0.5 text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-8">
              {feeMethods.map((method) => (
                <RadioOption
                  key={method.code}
                  label={method.name}
                  checked={state.feeBasis === method.code}
                  onSelect={() => update("feeBasis", method.code as CalcMethod)}
                />
              ))}
            </div>
          </div>

          <hr className="my-6 border-slate-100" />

          {state.feeBasis === "TIERED" ? (
            <>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tier Schedule<span className="ml-0.5 text-red-500">*</span>
              </label>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-medium text-slate-500">
                      <th className="w-8 px-2 py-2.5"></th>
                      <th className="px-3 py-2.5">Min FOB (USD)</th>
                      <th className="px-3 py-2.5">Max FOB (USD)</th>
                      <th className="px-3 py-2.5">Member Rate (%)</th>
                      <th className="px-3 py-2.5">Non-Member Rate (%)</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.tiers.map((tier) => (
                      <TierRow
                        key={tier.id}
                        tier={tier}
                        editing={editingTierId === tier.id}
                        onEdit={() => setEditingTierId(tier.id)}
                        onDone={() => setEditingTierId(null)}
                        onChange={(patch) => updateTier(tier.id, patch)}
                        onDelete={() => removeTier(tier.id)}
                      />
                    ))}
                    {state.tiers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                          No tiers yet. Add one to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addTier}
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add Tier
              </button>

              <hr className="my-6 border-slate-100" />
            </>
          ) : state.feeBasis === "PERCENTAGE" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Member Rate (%)"
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
                  label="Non-Member Rate (%)"
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
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Member Fee"
                  required
                  hint="Applied to companies with active NACCIMA membership"
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={state.memberAmount}
                    onChange={(e) => update("memberAmount", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Non-Member Fee"
                  required
                  hint="Applied to companies without active membership"
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={state.nonMemberAmount}
                    onChange={(e) => update("nonMemberAmount", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <hr className="my-6 border-slate-100" />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="VAT Rate" required hint="Value Added Tax rate as decimal (e.g., 0.075 for 7.5%)">
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

          <div className="grid grid-cols-2 gap-4">
            <Field
              label={`Processing Fee (${state.currency})`}
              hint="Additional flat fee applied to total payable"
            >
              <input
                type="text"
                inputMode="decimal"
                value={state.processingFee}
                onChange={(e) => update("processingFee", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Rounding" hint="How the final amount is rounded">
              <Select
                value={state.rounding}
                onChange={(v) => update("rounding", v as Rounding)}
                options={ROUNDING_OPTIONS}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        {/* Fee Summary */}
        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Fee Summary</h2>

          <div className="mt-5 rounded-lg bg-indigo-50/60 p-5">
            <p className="text-sm font-semibold text-indigo-600">Calculation Example</p>

            <dl className="mt-3 space-y-2.5 text-sm">
              <SummaryRow label="FOB Value (USD)" value={formatUsd(String(SAMPLE_FOB_VALUE))} />

              {state.feeBasis === "TIERED" && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                  <dt className="font-medium text-emerald-700">Applicable Tier</dt>
                  <dd className="font-semibold text-emerald-700">
                    {applicableTier
                      ? `${formatUsd(applicableTier.minFob)} – ${
                          applicableTier.maxFob.trim() === "" ? "Unlimited" : formatUsd(applicableTier.maxFob)
                        }`
                      : "No matching tier"}
                  </dd>
                </div>
              )}

              <SummaryRow label="Company Status" value="Member" />
              <SummaryRow
                label="Applicable Rate"
                value={
                  state.feeBasis === "FLAT"
                    ? formatCurrency(parseFloat(state.memberAmount) || 0, state.currency)
                    : `${calc.memberRatePct.toFixed(3)}%`
                }
              />

              {state.currency !== "USD" && (
                <div className="pt-1">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">{state.currency} Exchange Rate</dt>
                    <dd className="font-medium text-slate-700">
                      1 USD = {state.currency} {exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </dd>
                  </div>
                  <p className="text-right text-xs text-slate-400">({EXCHANGE_RATE_TIMESTAMP})</p>
                </div>
              )}
            </dl>

            <hr className="my-4 border-indigo-100" />

            <dl className="space-y-2.5 text-sm">
              {state.currency !== "USD" && (
                <SummaryRow
                  label={`Converted FOB (${state.currency})`}
                  value={formatCurrency(convertedFob, state.currency)}
                />
              )}
              <SummaryRow
                label={
                  state.feeBasis === "FLAT"
                    ? "Certificate Fee"
                    : `Certificate Fee (${calc.memberRatePct.toFixed(3)}%)`
                }
                value={formatCurrency(calc.memberFee, state.currency)}
              />
              <SummaryRow
                label={`VAT (${state.vatRate}%)`}
                value={formatCurrency(calc.memberVat, state.currency)}
              />
              <SummaryRow label="Processing Fee" value={formatCurrency(calc.processingFee, state.currency)} />
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

          <div className="mt-6 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <div>
              {state.feeBasis === "TIERED" ? (
                <>
                  <p className="text-sm text-blue-800">
                    The tier is selected using the original USD FOB value.
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    The selected rate is then applied after currency conversion.
                  </p>
                </>
              ) : (
                <p className="text-sm text-blue-800">
                  The applicable rate (Member or Non-Member) will be determined at the time of
                  application submission based on the company&rsquo;s membership status.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Error message */}
      {submitError && (
        <div className="mx-1 mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Success message */}
      {submitSuccess && (
        <div className="mx-1 mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          {submitSuccess}
        </div>
      )}

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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
});

FeeStructurePanel.displayName = 'FeeStructurePanel';

export default FeeStructurePanel;

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const cellInputClass =
  "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

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
      <dt className={emphasized ? "font-medium text-slate-700" : "text-slate-500"}>{label}</dt>
      <dd
        className={emphasized ? "font-semibold text-indigo-700" : "font-medium text-slate-700"}
      >
        {value}
      </dd>
    </div>
  );
}

function TierRow({
  tier,
  editing,
  onEdit,
  onDone,
  onChange,
  onDelete,
}: {
  tier: Tier;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onChange: (patch: Partial<Tier>) => void;
  onDelete: () => void;
}) {
  if (editing) {
    return (
      <tr className="bg-indigo-50/40">
        <td className="px-2 py-2 text-slate-300">
          <GripVertical className="h-4 w-4" />
        </td>
        <td className="px-2 py-2">
          <input
            type="text"
            inputMode="decimal"
            value={tier.minFob}
            onChange={(e) => onChange({ minFob: e.target.value })}
            className={cellInputClass}
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Unlimited"
            value={tier.maxFob}
            onChange={(e) => onChange({ maxFob: e.target.value })}
            className={cellInputClass}
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="text"
            inputMode="decimal"
            value={tier.memberRate}
            onChange={(e) => onChange({ memberRate: e.target.value })}
            className={cellInputClass}
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="text"
            inputMode="decimal"
            value={tier.nonMemberRate}
            onChange={(e) => onChange({ nonMemberRate: e.target.value })}
            className={cellInputClass}
          />
        </td>
        <td className="px-2 py-2">
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={onDone}
              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
              aria-label="Save tier"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
              aria-label="Delete tier"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-2 py-3 text-slate-300">
        <GripVertical className="h-4 w-4" />
      </td>
      <td className="px-3 py-3 text-slate-700">{formatUsd(tier.minFob)}</td>
      <td className="px-3 py-3 text-slate-700">
        {tier.maxFob.trim() === "" ? "Unlimited" : formatUsd(tier.maxFob)}
      </td>
      <td className="px-3 py-3 text-slate-700">{tier.memberRate}</td>
      <td className="px-3 py-3 text-slate-700">{tier.nonMemberRate}</td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Edit tier"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete tier"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}