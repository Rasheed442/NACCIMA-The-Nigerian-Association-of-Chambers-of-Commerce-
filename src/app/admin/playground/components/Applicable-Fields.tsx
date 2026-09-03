"use client";

import { useMemo, useState } from "react";
import {
  CreditCard,
  User,
  MapPin,
  BadgeCheck,
  Mail,
  Plane,
  Users,
  UserRound,
  Compass,
  Globe2,
  Code2,
  DollarSign,
  Tag,
  Landmark,
  MessageSquareText,
  Ruler,
  Scale,
  CalendarDays,
  FileText,
  ListOrdered,
  PackageSearch,
  Type,
  Hash,
  Building2,
  FileCheck2,
  CalendarCheck2,
  PenLine,
  Stamp,
  ShieldCheck,
  Info,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

type Badge = "nrs-locked" | "read-only" | null;

interface FieldDef {
  id: string;
  label: string;
  icon: LucideIcon;
  badge: Badge;
  defaultEnabled: boolean;
}

const FIELDS: FieldDef[] = [
  { id: "tin", label: "Tax Identification No. (TIN)", icon: CreditCard, badge: "nrs-locked", defaultEnabled: true },
  { id: "shipperName", label: "Shipper's Name", icon: User, badge: "nrs-locked", defaultEnabled: true },
  { id: "shipperAddress", label: "Shipper's Address", icon: MapPin, badge: "nrs-locked", defaultEnabled: true },
  { id: "approvalNumber", label: "Approval Number", icon: BadgeCheck, badge: null, defaultEnabled: true },
  { id: "importerEmail", label: "Importer Email", icon: Mail, badge: null, defaultEnabled: true },
  { id: "modeOfTransport", label: "Mode of Transport", icon: Plane, badge: null, defaultEnabled: true },
  { id: "consignee", label: "Consignee", icon: Users, badge: null, defaultEnabled: true },
  { id: "carrier", label: "Carrier", icon: UserRound, badge: null, defaultEnabled: true },
  { id: "destination", label: "Destination", icon: Compass, badge: null, defaultEnabled: true },
  { id: "countryOfManufacturing", label: "Country of Manufacturing", icon: Globe2, badge: null, defaultEnabled: true },

  { id: "hsCode", label: "HS Code", icon: Code2, badge: null, defaultEnabled: true },
  { id: "fobValue", label: "FOB Value (USD for CoO)", icon: DollarSign, badge: null, defaultEnabled: true },
  { id: "marksNo", label: "Marks / No.", icon: Tag, badge: null, defaultEnabled: true },
  { id: "ecowasNumber", label: "ECOWAS Number", icon: Landmark, badge: null, defaultEnabled: false },
  { id: "criteriaEtls", label: "Criteria (ETLS)", icon: MessageSquareText, badge: null, defaultEnabled: false },
  { id: "unitOfMeasurement", label: "Unit of Measurement", icon: Ruler, badge: null, defaultEnabled: false },
  { id: "grossWeight", label: "Gross Weight or Quantity", icon: Scale, badge: null, defaultEnabled: true },
  { id: "date", label: "Date", icon: CalendarDays, badge: null, defaultEnabled: true },
  { id: "invoiceNumberDate", label: "Invoice Number & Date", icon: FileText, badge: null, defaultEnabled: true },
  { id: "nomenclature", label: "Nomenclature of Goods", icon: ListOrdered, badge: null, defaultEnabled: true },

  { id: "numberKindPackages", label: "Number and Kind of Packages", icon: PackageSearch, badge: null, defaultEnabled: true },
  { id: "descriptionOfGoods", label: "Description of Goods", icon: Type, badge: null, defaultEnabled: true },
  { id: "totalItems", label: "Total Items", icon: Hash, badge: null, defaultEnabled: true },
  { id: "issuingOffice", label: "Issuing Office", icon: Building2, badge: "read-only", defaultEnabled: true },
  { id: "certificateNumber", label: "Certificate Number", icon: FileCheck2, badge: "read-only", defaultEnabled: true },
  { id: "issueDate", label: "Issue Date", icon: CalendarCheck2, badge: "read-only", defaultEnabled: true },
  { id: "signature", label: "Signature", icon: PenLine, badge: "read-only", defaultEnabled: true },
  { id: "sealStamp", label: "Seal / Stamp", icon: Stamp, badge: "read-only", defaultEnabled: true },
  { id: "verificationCode", label: "Verification Code", icon: ShieldCheck, badge: "read-only", defaultEnabled: true },
];

// Split into the three visual columns, preserving screenshot order.
const COLUMN_SIZE = 10;
const COLUMNS = [
  FIELDS.slice(0, COLUMN_SIZE),
  FIELDS.slice(COLUMN_SIZE, COLUMN_SIZE * 2),
  FIELDS.slice(COLUMN_SIZE * 2),
];

export default function ApplicableFieldsPanel() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.id, f.defaultEnabled]))
  );

  const enabledCount = useMemo(
    () => Object.values(enabled).filter(Boolean).length,
    [enabled]
  );

  const toggle = (id: string) =>
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAll = () =>
    setEnabled(Object.fromEntries(FIELDS.map((f) => [f.id, true])));

  const clearAll = () =>
    setEnabled(Object.fromEntries(FIELDS.map((f) => [f.id, false])));

  return (
    <div className="h-full flex flex-col text-slate-900">
      <div className="rounded border border-[#e2e8f0] bg-white p-6 shadow-lg flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#1a4a8a]">
              Applicable Fields
            </h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Select the fields that are applicable for this certificate type.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-[#1a4a8a] bg-[#e8f0fe] px-4 py-2 text-[14px] font-semibold text-[#1a4a8a] hover:bg-[#d4e6fd] transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-[14px] font-semibold text-[#475569] hover:bg-[#f1f5f9] transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Field columns */}
        <div className="flex-1 grid grid-cols-1 divide-y divide-[#e2e8f0] border-t border-[#e2e8f0] md:grid-cols-3 md:divide-x md:divide-y-0 md:border-t-0 overflow-auto">
          {COLUMNS.map((column, colIdx) => (
            <div key={colIdx} className="divide-y divide-[#e2e8f0] md:px-5 md:first:pl-0 md:last:pr-0">
              {column.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  checked={enabled[field.id]}
                  onToggle={() => toggle(field.id)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="mt-6 flex gap-3 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1a4a8a]" />
          <div className="space-y-1 text-sm text-[#1e3a5f]">
            <p>
              Fields marked as{" "}
              <span className="font-semibold text-[14px] text-[#1a4a8a]">NRS-locked</span> are
              auto-populated from Nigeria Revenue Service (NRS) using the company
              TIN and cannot be edited.
            </p>
            <p>
              <span className="font-semibold text-[#1a4a8a]">Read-only</span>{" "}
              fields are system generated and will not appear on the application
              form.
            </p>
          </div>
        </div>
      </div>

      {/* Footer / pagination */}
      <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-4 py-6 text-sm text-[#64748b]">
          <span>Page 1 of 1</span>
          <span className="text-[#cbd5e1]">|</span>
          <span>Total Fields: {FIELDS.length}</span>
          <span className="text-[#cbd5e1]">|</span>
          <span>Enabled Fields: {enabledCount}</span>
        </div>
        <div className="flex gap-2 py-8">
          <button
            type="button"
            disabled
            className="flex items-center gap-1 rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold text-[#94a3b8] disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg bg-[#1a4a8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a5a9a] transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  checked,
  onToggle,
}: {
  field: FieldDef;
  checked: boolean;
  onToggle: () => void;
}) {
  const Icon = field.icon;

  return (
    <div className="flex items-center justify-between gap-3 py-3.5 hover:bg-[#f8fafc] transition-colors rounded-lg px-2 -mx-2">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-[#94a3b8]" />
        <span className="truncate text-sm text-[#334155] font-medium">{field.label}</span>
        {field.badge === "nrs-locked" && (
          <span className="shrink-0 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-0.5 text-[10px] font-semibold text-[#64748b]">
            NRS-locked
          </span>
        )}
        {field.badge === "read-only" && (
          <span className="shrink-0 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-0.5 text-[10px] font-semibold text-[#64748b]">
            Read-only
          </span>
        )}
      </div>

      <Toggle checked={checked} onChange={onToggle} label={field.label} />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a8a] focus-visible:ring-offset-1 ${
        checked ? "bg-[#1a4a8a] shadow-md" : "bg-[#cbd5e1]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}