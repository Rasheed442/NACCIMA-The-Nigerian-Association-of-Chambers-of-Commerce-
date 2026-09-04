"use client";

import { useMemo, useState, useEffect } from "react";
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
  ChevronUp,
  ChevronDown,
  ClipboardList,
  Lock,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { apiFetch, getBaseUrl } from "@/utils/api";

type Group = "application" | "nrsLocked" | "readOnly";
type Badge = "nrs-locked" | "read-only" | null;

interface FieldDef {
  id: string;
  label: string;
  icon: LucideIcon;
  type: string;
  group: Group;
  badge: Badge;
  defaultEnabled: boolean;
}

interface ApiField {
  code: string;
  name: string;
  category: string;
  systemRequired: boolean;
  systemGenerated: boolean;
  readOnly: boolean;
}

// Icon mapping for API fields
const ICON_MAP: Record<string, LucideIcon> = {
  TIN: CreditCard,
  SHIPPER_NAME: User,
  SHIPPER_ADDRESS: MapPin,
  APPROVAL_NUMBER: BadgeCheck,
  IMPORTER_EMAIL: Mail,
  MODE_OF_TRANSPORT: Plane,
  CONSIGNEE: Users,
  CARRIER: UserRound,
  DESTINATION: Compass,
  COUNTRY_OF_MANUFACTURING: Globe2,
  HS_CODE: Code2,
  FOB_VALUE: DollarSign,
  MARKS_NO: Tag,
  ECOWAS_NUMBER: Landmark,
  CRITERIA_ETLS: MessageSquareText,
  UNIT_OF_MEASUREMENT: Ruler,
  GROSS_WEIGHT: Scale,
  DATE: CalendarDays,
  INVOICE_NUMBER: FileText,
  NOMENCLATURE: ListOrdered,
  NUMBER_KIND_PACKAGES: PackageSearch,
  DESCRIPTION_OF_GOODS: Type,
  TOTAL_ITEMS: Hash,
  ISSUING_OFFICE: Building2,
  CERTIFICATE_NUMBER: FileCheck2,
  ISSUE_DATE: CalendarCheck2,
  SIGNATURE: PenLine,
  SEAL_STAMP: Stamp,
  VERIFICATION_CODE: ShieldCheck,
};

// Type mapping for API fields
const TYPE_MAP: Record<string, string> = {
  TIN: "Text",
  SHIPPER_NAME: "Text",
  SHIPPER_ADDRESS: "Text",
  APPROVAL_NUMBER: "Text",
  IMPORTER_EMAIL: "Email",
  MODE_OF_TRANSPORT: "Dropdown",
  CONSIGNEE: "Text",
  CARRIER: "Text",
  DESTINATION: "Text",
  COUNTRY_OF_MANUFACTURING: "Text",
  HS_CODE: "Text",
  FOB_VALUE: "Number",
  MARKS_NO: "Text",
  ECOWAS_NUMBER: "Text",
  CRITERIA_ETLS: "Text",
  UNIT_OF_MEASUREMENT: "Text",
  GROSS_WEIGHT: "Number",
  DATE: "Date",
  INVOICE_NUMBER: "Text",
  NOMENCLATURE: "Text",
  NUMBER_KIND_PACKAGES: "Text",
  DESCRIPTION_OF_GOODS: "Text",
  TOTAL_ITEMS: "Number",
  ISSUING_OFFICE: "Text",
  CERTIFICATE_NUMBER: "Text",
  ISSUE_DATE: "Date",
  SIGNATURE: "Image",
  SEAL_STAMP: "Image",
  VERIFICATION_CODE: "Text",
};

// Fallback fields if API fails
const FALLBACK_FIELDS: FieldDef[] = [
  { id: "importerEmail", label: "Importer Email", icon: Mail, type: "Email", group: "application", badge: null, defaultEnabled: true },
  { id: "modeOfTransport", label: "Mode of Transport", icon: Plane, type: "Dropdown", group: "application", badge: null, defaultEnabled: true },
  { id: "consignee", label: "Consignee", icon: Users, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "carrier", label: "Carrier", icon: UserRound, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "destination", label: "Destination", icon: Compass, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "countryOfManufacturing", label: "Country of Manufacturing", icon: Globe2, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "hsCode", label: "HS Code", icon: Code2, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "fobValue", label: "FOB Value (USD for CoO)", icon: DollarSign, type: "Number", group: "application", badge: null, defaultEnabled: true },
  { id: "marksNo", label: "Marks / No.", icon: Tag, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "ecowasNumber", label: "ECOWAS Number", icon: Landmark, type: "Text", group: "application", badge: null, defaultEnabled: false },
  { id: "criteriaEtls", label: "Criteria (ETLS)", icon: MessageSquareText, type: "Text", group: "application", badge: null, defaultEnabled: false },
  { id: "unitOfMeasurement", label: "Unit of Measurement", icon: Ruler, type: "Text", group: "application", badge: null, defaultEnabled: false },
  { id: "numberKindPackages", label: "Number and Kind of Packages", icon: PackageSearch, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "descriptionOfGoods", label: "Description of Goods", icon: Type, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "totalItems", label: "Total Items", icon: Hash, type: "Number", group: "application", badge: null, defaultEnabled: true },
  { id: "grossWeight", label: "Gross Weight or Quantity", icon: Scale, type: "Number", group: "application", badge: null, defaultEnabled: true },
  { id: "date", label: "Date", icon: CalendarDays, type: "Date", group: "application", badge: null, defaultEnabled: true },
  { id: "nomenclature", label: "Nomenclature of Goods", icon: ListOrdered, type: "Text", group: "application", badge: null, defaultEnabled: true },
  { id: "tin", label: "Tax Identification No. (TIN)", icon: CreditCard, type: "Text", group: "nrsLocked", badge: "nrs-locked", defaultEnabled: true },
  { id: "shipperName", label: "Shipper's Name", icon: User, type: "Text", group: "nrsLocked", badge: "nrs-locked", defaultEnabled: true },
  { id: "shipperAddress", label: "Shipper's Address", icon: MapPin, type: "Text", group: "nrsLocked", badge: "nrs-locked", defaultEnabled: true },
  { id: "approvalNumber", label: "Approval Number", icon: BadgeCheck, type: "Text", group: "readOnly", badge: "read-only", defaultEnabled: true },
  { id: "issuingOffice", label: "Issuing Office", icon: Building2, type: "Text", group: "readOnly", badge: "read-only", defaultEnabled: true },
  { id: "sealStamp", label: "Seal / Stamp", icon: Stamp, type: "Image", group: "readOnly", badge: "read-only", defaultEnabled: true },
  { id: "certificateNumber", label: "Certificate Number", icon: FileCheck2, type: "Text", group: "readOnly", badge: "read-only", defaultEnabled: true },
  { id: "issueDate", label: "Issue Date", icon: CalendarCheck2, type: "Date", group: "readOnly", badge: "read-only", defaultEnabled: true },
  { id: "verificationCode", label: "Verification Code", icon: ShieldCheck, type: "Text", group: "readOnly", badge: "read-only", defaultEnabled: true },
  { id: "signature", label: "Signature", icon: PenLine, type: "Image", group: "readOnly", badge: "read-only", defaultEnabled: true },
];

function mapApiFieldToFieldDef(apiField: ApiField): FieldDef {
  const icon = ICON_MAP[apiField.code] || FileText;
  const type = TYPE_MAP[apiField.code] || "Text";
  
  let group: Group = "application";
  let badge: Badge = null;
  
  if (apiField.readOnly || apiField.systemGenerated) {
    group = "readOnly";
    badge = "read-only";
  } else if (apiField.systemRequired) {
    group = "nrsLocked";
    badge = "nrs-locked";
  }
  
  return {
    id: apiField.code,
    label: apiField.name,
    icon,
    type,
    group,
    badge,
    defaultEnabled: true,
  };
}

const GROUP_META: Record<
  Group,
  {
    title: string;
    description: string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    cardBorder: string;
    headerBg: string;
  }
> = {
  application: {
    title: "Application Fields",
    description: "Provided by exporter/applicant at the time of application.",
    icon: ClipboardList,
    iconBg: "bg-[#e8f0fe]",
    iconColor: "text-[#1a4a8a]",
    cardBorder: "border-[#e2e8f0]",
    headerBg: "bg-white",
  },
  nrsLocked: {
    title: "NRS-locked Fields",
    description:
      "Auto-populated from Nigeria Revenue Service (NRS) using company TIN. Cannot be edited.",
    icon: Lock,
    iconBg: "bg-[#fef3c7]",
    iconColor: "text-[#b45309]",
    cardBorder: "border-[#fde68a]",
    headerBg: "bg-[#fffbeb]",
  },
  readOnly: {
    title: "System-generated / Read-only Fields",
    description:
      "Generated or populated by the system. Displayed as read-only on the application form.",
    icon: Settings2,
    iconBg: "bg-[#ede9fe]",
    iconColor: "text-[#6d28d9]",
    cardBorder: "border-[#e2e8f0]",
    headerBg: "bg-white",
  },
};

const GROUP_ORDER: Group[] = ["application", "nrsLocked", "readOnly"];
const COLUMN_COUNT = 3;

export default function ApplicableFieldsPanel() {
  const [fields, setFields] = useState<FieldDef[]>(FALLBACK_FIELDS);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FALLBACK_FIELDS.map((f) => [f.id, f.defaultEnabled]))
  );
  const [openGroups, setOpenGroups] = useState<Record<Group, boolean>>({
    application: true,
    nrsLocked: true,
    readOnly: true,
  });

  // Fetch fields from API
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const baseUrl = getBaseUrl();
        const response = await apiFetch(`${baseUrl}/api/v1/admin/certificate-fields`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          const mappedFields = data.data.map(mapApiFieldToFieldDef);
          setFields(mappedFields);
          setEnabled(Object.fromEntries(mappedFields.map((f:any) => [f.id, f.defaultEnabled])));
        }
      } catch (error) {
        console.error('Failed to fetch certificate fields:', error);
        // Keep using fallback fields
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  const enabledCount = useMemo(
    () => Object.values(enabled).filter(Boolean).length,
    [enabled]
  );

  const toggle = (id: string) =>
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAll = () =>
    setEnabled(Object.fromEntries(fields.map((f) => [f.id, true])));

  const clearAll = () =>
    setEnabled(Object.fromEntries(fields.map((f) => [f.id, false])));

  const toggleGroupOpen = (group: Group) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  const fieldsByGroup = useMemo(() => {
    const map: Record<Group, FieldDef[]> = {
      application: [],
      nrsLocked: [],
      readOnly: [],
    };
    fields.forEach((f) => map[f.group].push(f));
    return map;
  }, [fields]);

  // Save enabled fields to localStorage when they change
  useEffect(() => {
    localStorage.setItem('applicable-fields-enabled', JSON.stringify(enabled));
  }, [enabled]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Loading fields...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-slate-900">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#1a4a8a]">Applicable Fields</h2>
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

        {/* Grouped sections */}
        <div className="flex-1 space-y-4 overflow-auto">
          {GROUP_ORDER.map((group) => {
            const meta = GROUP_META[group];
            const GroupIcon = meta.icon;
            const groupFields = fieldsByGroup[group];
            const groupEnabledCount = groupFields.filter((f) => enabled[f.id]).length;
            const isOpen = openGroups[group];

            // Split this group's fields into up to 3 columns, preserving order.
            const perCol = Math.ceil(groupFields.length / COLUMN_COUNT);
            const columns = Array.from({ length: COLUMN_COUNT }, (_, i) =>
              groupFields.slice(i * perCol, (i + 1) * perCol)
            ).filter((c) => c.length > 0);

            return (
              <div
                key={group}
                className={`rounded-xl border ${meta.cardBorder} bg-white shadow-sm overflow-hidden`}
              >
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroupOpen(group)}
                  className={`w-full flex items-center justify-between gap-3 px-5 py-4 ${meta.headerBg} hover:brightness-[0.98] transition`}
                >
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}
                    >
                      <GroupIcon className={`h-4 w-4 ${meta.iconColor}`} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1a4a8a]">{meta.title}</span>
                        <span className="rounded-full bg-[#f1f5f9] border border-[#e2e8f0] px-2 py-0.5 text-[11px] font-semibold text-[#64748b]">
                          {groupFields.length}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#64748b] md:whitespace-normal">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-sm text-[#64748b]">
                      {groupEnabledCount} of {groupFields.length} enabled
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#64748b]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#64748b]" />
                    )}
                  </div>
                </button>

                {/* Group body */}
                {isOpen && (
                  <div className="border-t border-[#e2e8f0] px-5 py-2 grid grid-cols-1 divide-y divide-[#e2e8f0] md:grid-cols-3 md:divide-x md:divide-y-0">
                    {columns.map((column, colIdx) => (
                      <div
                        key={colIdx}
                        className="divide-y divide-[#e2e8f0] md:px-5 md:first:pl-0 md:last:pr-0"
                      >
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
                )}
              </div>
            );
          })}
        </div>

        {/* Info banner */}
        <div className="mt-6 flex gap-3 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1a4a8a]" />
          <div className="space-y-1 text-sm text-[#1e3a5f]">
            <p>
              Fields marked as{" "}
              <span className="font-semibold text-[14px] text-[#1a4a8a]">NRS-locked</span> are
              auto-populated from Nigeria Revenue Service (NRS) using the company TIN and cannot
              be edited.
            </p>
            <p>
              <span className="font-semibold text-[#1a4a8a]">Read-only</span> fields are system
              generated and will not appear on the application form.
            </p>
          </div>
        </div>
      </div>

      {/* Footer / pagination */}
      <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-4 py-6 text-sm text-[#64748b]">
          <span>Page 1 of 1</span>
          <span className="text-[#cbd5e1]">|</span>
          <span>Total Fields: {fields.length}</span>
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
        <span className="shrink-0 rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-2 py-0.5 text-[10px] font-medium text-[#94a3b8]">
          {field.type}
        </span>
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