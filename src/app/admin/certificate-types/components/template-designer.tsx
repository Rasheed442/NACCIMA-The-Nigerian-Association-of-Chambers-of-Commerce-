'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { type IconType } from 'react-icons';
import {
  FiZoomIn,
  FiZoomOut,
  FiSave,
  FiMoreVertical,
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiTrash2,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiSettings,
  FiUser,
  FiMapPin,
  FiMail,
  FiTruck,
  FiUsers,
  FiGlobe,
  FiHash,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiShield,
  FiGrid,
  FiCheckSquare,
  FiEye,
  FiUpload,
  FiRefreshCw,
  FiImage,
  FiBarChart,
  FiEdit,
  FiX,
} from 'react-icons/fi';
import General, { type GeneralRef } from './General';
import ApplicableFields, { type ApplicableFieldsRef } from './Applicable-Fields';
import RequiredDocuments, { type RequiredDocumentsRef } from './Required-documents';
import MemberingFormat, { type MemberingFormatRef } from './MemberingFormat';
import FeeCharges, { type FeeChargesRef } from './FeeCharges';
import { apiFetch, getBaseUrl } from '@/utils/api';

// Simple SwitchField component
interface SwitchFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchField({ label, checked, onChange }: SwitchFieldProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[#4f46e5]' : 'bg-[#d1d5db]'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${checked ? 'left-5' : 'left-0.5'}`} />
        </div>
      </div>
      <span className="text-sm text-[#3a4560]">{label}</span>
    </label>
  );
}

// NOTE (fix): a palette row is draggable *and* clickable (click = "add at a
// sensible default spot", drag = "add exactly where dropped"). Some browsers
// still fire a `click` event on the source element after a drag-and-drop
// gesture completes, even though the pointer moved. Previously this meant a
// single drag-onto-canvas action could call `onAdd` twice: once from
// `onDrop` (correct position) and once from the stray `click` (fixed
// fallback position), producing a duplicate/overlapping field that appeared
// to "jump" to the top-left of the page. `draggingRef` suppresses the click
// handler for the duration of (and immediately after) a drag gesture.
function PaletteRow({ item, onAdd }: { item: PaletteItem; onAdd: () => void }) {
  const Icon = item.icon;
  const draggingRef = useRef(false);

  const handleDragStart = (e: React.DragEvent) => {
    draggingRef.current = true;
    e.dataTransfer.setData('text/plain', item.type);
  };

  const handleDragEnd = () => {
    // Defer clearing the flag so a trailing synthetic click (fired right
    // after dragend in some browsers) still sees draggingRef as true.
    setTimeout(() => {
      draggingRef.current = false;
    }, 0);
  };

  const handleClick = () => {
    if (draggingRef.current) return;
    onAdd();
  };

  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2 border border-[#e5e8f0] rounded-lg cursor-grab hover:border-[#1a4a8a] hover:bg-[#f5f8ff] transition-all group"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <Icon size={13} className="text-[#8a94ac] group-hover:text-[#1a4a8a] transition-colors shrink-0" />
      <span className="text-[12px] font-medium text-[#1a2236] flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold border ${
            item.badge === 'NRS-locked'
              ? 'bg-[#fff8e6] border-[#f0d896] text-[#92720c]'
              : item.badge === 'System'
              ? 'bg-[#f1eefc] border-[#d7cdf5] text-[#5b3fae]'
              : 'bg-[#eef1ff] border-[#cfd6fb] text-[#3c46a3]'
          }`}
        >
          {item.badge}
        </span>
      )}
    </div>
  );
}

interface TemplateDesignerProps {
  mode?: 'create' | 'edit';
  certificateType?: any;
}

export interface TemplateDesignerData {
  templateConfig: {
    elements: FieldElement[];
    pageSize: { width: number; height: number } | null;
  };
}

export interface TemplateDesignerRef {
  getData: () => TemplateDesignerData;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Align = 'left' | 'center' | 'right';
type VAlign = 'top' | 'middle' | 'bottom';
type BorderStyle = 'none' | 'solid' | 'dashed';
type FieldKind = 'nrs-locked' | 'application' | 'goods' | 'system' | 'component';
type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface Padding {
  t: number;
  r: number;
  b: number;
  l: number;
}

interface FieldElement {
  id: string;
  text: string; // canvas token, e.g. DESCRIPTION_OF_GOODS
  label: string; // human label for the properties panel
  typeLabel: string; // "Text", "Multi-line text", "Number", ...
  source: string; // "NRS", "Goods Item", "System", "Manual Entry"
  kind: FieldKind;
  enabled: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  leading: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: Align;
  valign: VAlign;
  color: string;
  bg: string;
  wrap: boolean;
  maxLines: number;
  required: boolean;
  readOnly: boolean;
  repeated: boolean;
  border: BorderStyle;
  borderColor: string;
  pad: Padding;
  imageUrl?: string;
}

// FIX: ids used to come from a module-level counter that always restarts
// at 1 on every page load. A certificate loaded for editing carries
// element ids ("el_3", "el_7", ...) assigned during a previous session
// with a different counter history, so the very first field added in a
// new session ("el_1") could collide with an id a saved field already
// has. Selection/highlighting matches purely by id ("el.id ===
// selectedId"), so two elements sharing an id get selected and
// highlighted together — clicking one visually highlights whichever
// other field happens to share its id. A truly unique id removes the
// possibility of that collision entirely.
const uid = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

/* ------------------------------------------------------------------ */
/* Visual language                                                     */
/* ------------------------------------------------------------------ */

const GREEN_BG = '#e9f7ee';
const GREEN_BORDER = '#8fc99c';
const GREEN_TEXT = '#1f6b32';

const PURPLE_BG = '#f1eefc';
const PURPLE_BORDER = '#a794e8';
const PURPLE_TEXT = '#5b3fae';

const INDIGO_BG = '#eef1ff';
const INDIGO_BORDER = '#9aa4e8';
const INDIGO_TEXT = '#3c46a3';

function kindPalette(kind: FieldKind) {
  if (kind === 'system') return { bg: PURPLE_BG, border: PURPLE_BORDER, text: PURPLE_TEXT, dashed: true };
  if (kind === 'component') return { bg: INDIGO_BG, border: INDIGO_BORDER, text: INDIGO_TEXT, dashed: true };
  return { bg: GREEN_BG, border: GREEN_BORDER, text: GREEN_TEXT, dashed: false };
}

/* ------------------------------------------------------------------ */
/* Paper geometry (PDF points, shared create/edit fallback)            */
/* ------------------------------------------------------------------ */

// These match the page dimensions persisted by getFormData when no PDF page
// metadata is available. Keeping one fallback prevents a new certificate's
// canvas from appearing larger than the same certificate in edit mode.
const PAPER_W = 608.16;
const PAPER_H = 1008.48;
const GRID_STEP = 8;

/* ------------------------------------------------------------------ */
/* Sizing                                                              */
/* ------------------------------------------------------------------ */

// Smallest a component can be resized to (PDF points).
const MIN_W = 16;
const MIN_H = 12;

// Text-like fields are dropped at a compact width so they don't look
// oversized on the template. Users can then drag the handles to fit.
const DEFAULT_MAX_W = 140;

// Canvas scroll container has p-8 (32px) padding around the page on every
// side (see the `p-8` wrapper around `canvasScrollRef`). Used to translate
// "visible center of the scroll container" into page-local coordinates.
const CANVAS_PADDING = 32;

// How far (in PDF points) each successive click-added field is nudged
// diagonally from the last, and how many steps before the cascade wraps
// back to the canvas-center position and starts again.
const CASCADE_STEP = 24;
const CASCADE_MAX = 10;

function defaultWidthFor(item: { kind: FieldKind; w: number }) {
  if (item.kind === 'goods' || item.w <= 100) return item.w;
  return Math.min(item.w, DEFAULT_MAX_W);
}

// The eight resize handles shown around the selected component.
const RESIZE_HANDLES: Array<{ key: ResizeHandle; left: string; top: string; cursor: string }> = [
  { key: 'nw', left: '0%', top: '0%', cursor: 'nwse-resize' },
  { key: 'n', left: '50%', top: '0%', cursor: 'ns-resize' },
  { key: 'ne', left: '100%', top: '0%', cursor: 'nesw-resize' },
  { key: 'e', left: '100%', top: '50%', cursor: 'ew-resize' },
  { key: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
  { key: 's', left: '50%', top: '100%', cursor: 'ns-resize' },
  { key: 'sw', left: '0%', top: '100%', cursor: 'nesw-resize' },
  { key: 'w', left: '0%', top: '50%', cursor: 'ew-resize' },
];

/* ------------------------------------------------------------------ */
/* Palette catalog                                                     */
/* ------------------------------------------------------------------ */

interface PaletteItem {
  type: string;
  label: string;
  icon: IconType;
  kind: FieldKind;
  typeLabel: string;
  source: string;
  w: number;
  h: number;
  badge?: 'NRS-locked' | 'System' | 'Component';
  category?: string;
}

interface ApiField {
  code: string;
  name: string;
  category: string;
  applicable: boolean;
  required: boolean;
  readOnly: boolean;
  templateComponent: string;
  repeatable: boolean;
}

const APPLICATION_FIELDS_VISIBLE = 14;
const TOTAL_ENABLED_FIELDS = 26;

// Mapping from templateComponent to component properties
const TEMPLATE_COMPONENT_MAP: Record<string, { icon: IconType; typeLabel: string; w: number; h: number }> = {
  TEXT: { icon: FiFileText, typeLabel: 'Text', w: 180, h: 18 },
  MULTI_LINE_TEXT: { icon: FiAlignLeft, typeLabel: 'Multi-line Text', w: 220, h: 40 },
  NUMBER: { icon: FiHash, typeLabel: 'Number', w: 140, h: 18 },
  DATE: { icon: FiCalendar, typeLabel: 'Date', w: 140, h: 18 },
  DROPDOWN: { icon: FiChevronDown, typeLabel: 'Dropdown', w: 200, h: 18 },
  CHECKBOX: { icon: FiCheckSquare, typeLabel: 'Checkbox', w: 22, h: 22 },
  GOODS_COLUMN: { icon: FiGrid, typeLabel: 'Goods Column', w: 120, h: 18 },
  QR_CODE: { icon: FiGrid, typeLabel: 'QR Code', w: 80, h: 80 },
  VERIFICATION_CODE: { icon: FiShield, typeLabel: 'Verification Code', w: 200, h: 22 },
  IMAGE: { icon: FiImage, typeLabel: 'Image', w: 100, h: 100 },
  BARCODE: { icon: FiBarChart, typeLabel: 'Barcode', w: 150, h: 40 },
  SIGNATURE: { icon: FiEdit, typeLabel: 'Signature', w: 172, h: 20 },
};

// Convert API field to PaletteItem
function apiFieldToPaletteItem(field: ApiField): PaletteItem {
  const component = TEMPLATE_COMPONENT_MAP[field.templateComponent] || TEMPLATE_COMPONENT_MAP.TEXT;
  let kind: FieldKind = 'application';
  let source = 'Manual Entry';
  let badge: 'NRS-locked' | 'System' | 'Component' | undefined;

  if (field.readOnly) {
    kind = 'system';
    source = 'System';
    badge = 'System';
  } else if (field.required && field.category === 'APPLICATION') {
    kind = 'nrs-locked';
    source = 'NRS';
    badge = 'NRS-locked';
  }

  return {
    type: field.code,
    label: field.name,
    icon: component.icon,
    kind,
    typeLabel: component.typeLabel,
    source,
    w: component.w,
    h: component.h,
    badge,
    category: field.category,
  };
}

// Full palette of all possible fields
const FULL_PALETTE_GROUPS: Array<{ label: string; items: PaletteItem[] }> = [
  {
    label: 'Application Fields',
    items: [
      { type: 'tin', label: 'TIN (Tax Identification No.)', icon: FiHash, kind: 'nrs-locked', typeLabel: 'Text', source: 'NRS', w: 180, h: 18, badge: 'NRS-locked' },
      { type: 'shipperName', label: "Shipper's Name", icon: FiUser, kind: 'nrs-locked', typeLabel: 'Text', source: 'NRS', w: 220, h: 18, badge: 'NRS-locked' },
      { type: 'shipperAddress', label: "Shipper's Address", icon: FiMapPin, kind: 'nrs-locked', typeLabel: 'Text', source: 'NRS', w: 220, h: 18, badge: 'NRS-locked' },
      { type: 'approvalNumber', label: 'Approval Number', icon: FiCheckSquare, kind: 'system', typeLabel: 'Text', source: 'System', w: 200, h: 22, badge: 'System' },
      { type: 'importerEmail', label: 'Importer Email', icon: FiMail, kind: 'application', typeLabel: 'Email', source: 'Manual Entry', w: 200, h: 18 },
      { type: 'modeOfTransport', label: 'Mode of Transport', icon: FiTruck, kind: 'application', typeLabel: 'Dropdown', source: 'Manual Entry', w: 200, h: 18 },
      { type: 'consignee', label: 'Consignee', icon: FiUsers, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 220, h: 18 },
      { type: 'consigneeAddress', label: 'Consignee Address', icon: FiMapPin, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 220, h: 18 },
      { type: 'carrier', label: 'Carrier', icon: FiTruck, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 180, h: 18 },
      { type: 'destination', label: 'Destination', icon: FiMapPin, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 180, h: 18 },
      { type: 'countryOfManufacturing', label: 'Country of Manufacturing', icon: FiGlobe, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 200, h: 18 },
      { type: 'fobValue', label: 'FOB Value (USD for CoO)', icon: FiDollarSign, kind: 'application', typeLabel: 'Number', source: 'Manual Entry', w: 180, h: 18 },
      { type: 'totalItems', label: 'Total Items', icon: FiHash, kind: 'application', typeLabel: 'Number', source: 'Manual Entry', w: 120, h: 18 },
      { type: 'date', label: 'Date', icon: FiCalendar, kind: 'application', typeLabel: 'Date', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'hsCode', label: 'HS Code', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'marksNo', label: 'Marks / No.', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'ecowasNumber', label: 'ECOWAS Number', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'criteriaEtls', label: 'Criteria (ETLS)', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'unitOfMeasurement', label: 'Unit of Measurement', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'numberKindPackages', label: 'Number and Kind of Packages', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'descriptionOfGoods', label: 'Description of Goods', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'grossWeight', label: 'Gross Weight or Quantity', icon: FiHash, kind: 'application', typeLabel: 'Number', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'nomenclature', label: 'Nomenclature of Goods', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'invoiceNumber', label: 'Invoice Number', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
    ],
  },
  {
    label: 'Goods Fields',
    items: [
      { type: 'goodsTable', label: 'Goods Table', icon: FiGrid, kind: 'goods', typeLabel: 'Table', source: 'Goods Item', w: 400, h: 120 },
    ],
  },
  {
    label: 'System Fields',
    items: [
      { type: 'certificateNumber', label: 'Certificate Number', icon: FiFileText, kind: 'system', typeLabel: 'Text', source: 'System', w: 168, h: 22, badge: 'System' },
      { type: 'verificationCode', label: 'Verification Code', icon: FiShield, kind: 'system', typeLabel: 'Text', source: 'System', w: 200, h: 22, badge: 'System' },
      { type: 'qrCode', label: 'QR Code', icon: FiGrid, kind: 'system', typeLabel: 'QR Code', source: 'System', w: 80, h: 80, badge: 'System' },
      { type: 'checkbox', label: 'Checkbox', icon: FiCheckSquare, kind: 'component', typeLabel: 'Checkbox', source: 'Manual Entry', w: 22, h: 22, badge: 'Component' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Tabs shell                                                          */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'applicable-fields', label: 'Applicable Fields' },
  { id: 'required-documents', label: 'Required Documents' },
  { id: 'template-designer', label: 'Template Designer' },
  { id: 'numbering-format', label: 'Numbering & Format' },
  { id: 'Fee', label: 'Fees & Charges' },
];

/* ------------------------------------------------------------------ */
/* Backend field-code mapping                                          */
/* ------------------------------------------------------------------ */
// The backend's templateConfig.fields object is keyed by the field CODE
// (e.g. "SHIPPER_NAME", "TIN"), not by the canvas element's internal id
// (e.g. "el_7"). This is the same map ApplicableFields/RequiredDocuments
// already use, so we reuse it here to translate the palette's camelCase
// `type` values into the backend's UPPER_SNAKE_CASE codes.
const FIELD_ID_MAP: Record<string, string> = {
  consigneeAddress: 'CONSIGNEE_ADDRESS',
  shipperName: 'SHIPPER_NAME',
  shipperAddress: 'SHIPPER_ADDRESS',
  tin: 'TIN',
  importerEmail: 'IMPORTER_EMAIL',
  modeOfTransport: 'MODE_OF_TRANSPORT',
  consignee: 'CONSIGNEE',
  carrier: 'CARRIER',
  destination: 'DESTINATION',
  countryOfManufacturing: 'COUNTRY_OF_MANUFACTURING',
  fobValue: 'FOB_VALUE',
  totalItems: 'TOTAL_ITEMS',
  date: 'DATE',
  hsCode: 'HS_CODE',
  marksNo: 'MARKS_NO',
  ecowasNumber: 'ECOWAS_NUMBER',
  criteriaEtls: 'CRITERIA_ETLS',
  unitOfMeasurement: 'UNIT_OF_MEASUREMENT',
  numberKindPackages: 'NUMBER_KIND_PACKAGES',
  descriptionOfGoods: 'DESCRIPTION_OF_GOODS',
  grossWeight: 'GROSS_WEIGHT',
  nomenclature: 'NOMENCLATURE',
  invoiceNumber: 'INVOICE_NUMBER',
  approvalNumber: 'APPROVAL_NUMBER',
  certificateNumber: 'CERTIFICATE_NUMBER',
  verificationCode: 'VERIFICATION_CODE',
  qrCode: 'QR_CODE',
};

// Resolve a canvas element's palette `type` (element.text) to the code the
// backend expects. Dynamic API-driven fields already arrive with their
// backend code as `type` (see apiFieldToPaletteItem -> type: field.code),
// so those pass through unchanged; the static fallback palette uses
// camelCase types that need translating via FIELD_ID_MAP.
function backendFieldCode(elementText: string): string {
  return FIELD_ID_MAP[elementText] || elementText;
}

const TemplateDesigner = forwardRef<TemplateDesignerRef, TemplateDesignerProps>(({ mode = 'create', certificateType }, ref) => {
  // New certificate types need their required details and template uploaded
  // before fields can be placed, so begin the create flow on General.
  const [activeTab, setActiveTab] = useState(mode === 'create' ? 'general' : 'template-designer');

  // Refs for child components
  const generalRef = useRef<GeneralRef>(null);
  const applicableFieldsRef = useRef<ApplicableFieldsRef>(null);
  const requiredDocumentsRef = useRef<RequiredDocumentsRef>(null);
  const memberingFormatRef = useRef<MemberingFormatRef>(null);
  const feeChargesRef = useRef<FeeChargesRef>(null);
  const [elements, setElements] = useState<FieldElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.9);
  const [gridOn, setGridOn] = useState(true);
  const [snapOn, setSnapOn] = useState(true);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [showAllApplicationFields, setShowAllApplicationFields] = useState(false);
  const [openBorderSection, setOpenBorderSection] = useState(false);
  const [openAdvancedSection, setOpenAdvancedSection] = useState(false);
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({});
  const [templateDataUrl, setTemplateDataUrl] = useState<string | null>(null);
  const [templatePageSize, setTemplatePageSize] = useState<{ width: number; height: number } | null>(null);
  const [apiFields, setApiFields] = useState<ApiField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [certificateTypeCode, setCertificateTypeCode] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingCertificate, setIsSavingCertificate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const [past, setPast] = useState<FieldElement[][]>([]);
  const [future, setFuture] = useState<FieldElement[][]>([]);

  // Effective page size (PDF points) used by the canvas and by resizing.
  const pageW = templatePageSize?.width || PAPER_W;
  const pageH = templatePageSize?.height || PAPER_H;

  // Load enabled fields from localStorage and listen for changes
  useEffect(() => {
    const loadEnabledFields = () => {
      const savedValue = localStorage.getItem('applicable-fields-enabled');
      if (savedValue) {
        try {
          setEnabledFields(JSON.parse(savedValue));
        } catch (e) {
          console.error('Failed to parse enabled fields:', e);
        }
      }
    };

    // Initial load
    loadEnabledFields();

    // Listen for storage changes (when localStorage is modified in another tab or window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'applicable-fields-enabled' && e.newValue) {
        try {
          setEnabledFields(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse enabled fields from storage event:', err);
        }
      }
    };

    // Listen for custom event (when localStorage is modified in the same tab)
    const handleCustomEvent = (e: CustomEvent) => {
      setEnabledFields(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('applicable-fields-changed', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('applicable-fields-changed', handleCustomEvent as EventListener);
    };
  }, []);

  // Listen for custom event (when template is uploaded in General tab)
  useEffect(() => {
    const handleTemplateEvent = (e: CustomEvent) => {
      setTemplateDataUrl(e.detail.dataUrl);
      setTemplatePageSize(e.detail.pageSize);
    };

    window.addEventListener('template-data-uploaded', handleTemplateEvent as EventListener);

    return () => {
      window.removeEventListener('template-data-uploaded', handleTemplateEvent as EventListener);
    };
  }, []);

  // When editing a certificate type, preload its already-uploaded PDF instead
  // of waiting for a new upload from the General tab.
  useEffect(() => {
    const templateUrl = certificateType?.templateUrl;
    if (!templateUrl) {
      setTemplateDataUrl(null);
      return;
    }

    const baseUrl = getBaseUrl();
    const resolvedTemplateUrl = /^https?:\/\//i.test(templateUrl) || templateUrl.startsWith('data:')
      ? templateUrl
      : `${baseUrl}${templateUrl.startsWith('/') ? '' : '/'}${templateUrl}`;

    setTemplateDataUrl(resolvedTemplateUrl);

    try {
      const config = typeof certificateType.templateConfig === 'string'
        ? JSON.parse(certificateType.templateConfig)
        : certificateType.templateConfig;
      const page = config?.page;
      if (Number.isFinite(page?.width) && Number.isFinite(page?.height)) {
        setTemplatePageSize({ width: page.width, height: page.height });
      }
    } catch {
      // A template preview can still be shown when no saved page metadata exists.
    }
  }, [certificateType?.id, certificateType?.templateUrl, certificateType?.templateConfig]);

  // Function to reload elements from certificate type
  const reloadElementsFromCertificateType = useCallback(() => {
    if (!certificateType) {
      setElements([]);
      setSelectedId(null);
      return;
    }

    try {
      const config = typeof certificateType.templateConfig === 'string'
        ? JSON.parse(certificateType.templateConfig)
        : certificateType.templateConfig;
      const loaded: FieldElement[] = Array.isArray(config?.elements) ? config.elements : [];
      // Safety net: de-duplicate ids on load. Selection/highlighting is
      // matched purely by id, so if a previously-saved template somehow
      // contains two elements with the same (or a missing) id, both would
      // get selected/highlighted together whenever either one is clicked.
      const seenIds = new Set<string>();
      const deduped = loaded.map((el) => {
        const isDuplicate = !el.id || seenIds.has(el.id);
        if (isDuplicate) {
          return { ...el, id: uid('el') };
        }
        seenIds.add(el.id);
        return el;
      });
      setElements(deduped);
      setSelectedId(null);
    } catch {
      setElements([]);
      setSelectedId(null);
    }
  }, [certificateType]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Notify sidebar about unsaved changes
    window.dispatchEvent(new CustomEvent('template-unsaved-changes', { detail: hasUnsavedChanges }));

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // The canvas must be populated from the record being edited.  This also
  // prevents fields from a previous certificate type leaking in through the
  // old, shared localStorage key.
  useEffect(() => {
    reloadElementsFromCertificateType();
  }, [reloadElementsFromCertificateType]);

  // Fetch fields from API
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const code = certificateType?.code;
        if (!code) {
          console.error('Certificate type code not available');
          setLoadingFields(false);
          return;
        }

        setCertificateTypeCode(code);

        const baseUrl = getBaseUrl();
        const response = await apiFetch(`${baseUrl}/api/v1/certificates/reference/types/${code}/fields`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setApiFields(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch certificate fields:', error);
        // Keep using fallback fields
      } finally {
        setLoadingFields(false);
      }
    };

    fetchFields();
  }, [certificateType]);

  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  // Counts consecutive fields added by clicking a palette row (as opposed to
  // dragging one to an explicit spot). Used to cascade their positions so
  // they don't all land on top of one another — see addComponent below.
  const clickAddIndexRef = useRef(0);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{
    id: string;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  const commit = useCallback((updater: (prev: FieldElement[]) => FieldElement[]) => {
    setHasUnsavedChanges(true);
    setElements((prev) => {
      setPast((p) => [...p.slice(-49), prev]);
      setFuture([]);
      return updater(prev);
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prevState = p[p.length - 1];
      setFuture((f) => [elements, ...f]);
      setElements(prevState);
      return p.slice(0, -1);
    });
  }, [elements]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const nextState = f[0];
      setPast((p) => [...p, elements]);
      setElements(nextState);
      return f.slice(1);
    });
  }, [elements]);

  const updateSelected = useCallback(
    (patch: Partial<FieldElement>) => {
      if (!selectedId) return;
      commit((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...patch } : e)));
    },
    [selectedId, commit]
  );

  const updateSelectedPad = useCallback(
    (patch: Partial<Padding>) => {
      if (!selectedId) return;
      commit((prev) => prev.map((e) => (e.id === selectedId ? { ...e, pad: { ...e.pad, ...patch } } : e)));
    },
    [selectedId, commit]
  );

  const deleteElement = useCallback(
    (id: string) => {
      commit((prev) => prev.filter((e) => e.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [commit]
  );

  const addComponent = useCallback(
    (item: PaletteItem, x?: number, y?: number) => {
      const p = kindPalette(item.kind);
      const w = defaultWidthFor(item);

      // FIX: previously, adding a field via click (as opposed to dragging
      // it onto a specific spot) always fell back to a fixed x/y of 60,60
      // — right at the top-left corner of the page, and often off-screen
      // once the user had scrolled/zoomed. When combined with the
      // duplicate-add bug (see PaletteRow), this made it look like a field
      // "jumped" to the top edge whenever a palette field was selected.
      // Now, when no explicit drop coordinates are given, the new field is
      // centered in whatever part of the canvas is currently visible.
      let posX = x;
      let posY = y;
      if (posX === undefined || posY === undefined) {
        const container = canvasScrollRef.current;
        let baseX: number;
        let baseY: number;
        if (container) {
          const visibleCenterX = container.scrollLeft + container.clientWidth / 2 - CANVAS_PADDING;
          const visibleCenterY = container.scrollTop + container.clientHeight / 2 - CANVAS_PADDING;
          baseX = visibleCenterX / zoom - w / 2;
          baseY = visibleCenterY / zoom - item.h / 2;
        } else {
          baseX = 60;
          baseY = 60;
        }

        // FIX: every click-added field used to land on this exact same
        // "center of the visible canvas" point, so clicking several
        // palette rows in a row stacked every field on top of the last
        // one — earlier fields were still there, just hidden underneath.
        // Cascade each successive click-added field diagonally (like a
        // paste-cascade in Figma/PowerPoint) so they land at distinct,
        // visible spots. The cascade resets to 0 offset once it reaches
        // CASCADE_MAX steps, and resumes from the (possibly moved) canvas
        // center again from there.
        const cascadeIndex = clickAddIndexRef.current % CASCADE_MAX;
        clickAddIndexRef.current += 1;
        posX = Math.round(baseX + cascadeIndex * CASCADE_STEP);
        posY = Math.round(baseY + cascadeIndex * CASCADE_STEP);

        // Keep the field on the page.
        posX = Math.min(Math.max(0, posX), Math.max(0, pageW - w));
        posY = Math.min(Math.max(0, posY), Math.max(0, pageH - item.h));
        if (snapOn) {
          posX = Math.round(posX / GRID_STEP) * GRID_STEP;
          posY = Math.round(posY / GRID_STEP) * GRID_STEP;
        }
      }

      const el: FieldElement = {
        id: uid('el'),
        text: item.type,
        label: item.label,
        typeLabel: item.typeLabel,
        source: item.source,
        kind: item.kind,
        enabled: true,
        x: posX,
        y: posY,
        // Compact default width so new fields don't look oversized;
        // drag the handles (or edit Width in the panel) to fit.
        w,
        h: item.h,
        fontSize: item.h <= 18 ? 8.5 : 9.5,
        leading: 9.5,
        fontFamily: 'Helvetica',
        bold: false,
        italic: false,
        underline: false,
        align: 'center',
        valign: 'middle',
        color: p.text,
        bg: p.bg,
        wrap: true,
        maxLines: 4,
        required: false,
        readOnly: item.kind === 'system',
        repeated: false,
        border: p.dashed ? 'dashed' : 'solid',
        borderColor: p.border,
        pad: { t: 2, r: 3, b: 2, l: 3 },
      };
      commit((prev) => [...prev, el]);
      setSelectedId(el.id);
    },
    [commit, zoom, snapOn, pageW, pageH]
  );

  const onElMouseDown = (e: React.MouseEvent, el: FieldElement) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    setPast((p) => [...p.slice(-49), elements]);
    setFuture([]);
    dragRef.current = { id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
  };

  const onResizeMouseDown = (e: React.MouseEvent, el: FieldElement, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    // One undo step for the whole resize gesture.
    setPast((p) => [...p.slice(-49), elements]);
    setFuture([]);
    dragRef.current = null;
    resizeRef.current = {
      id: el.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.w,
      origH: el.h,
    };
  };

  const onDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');

    // Search in both dynamic API fields and fallback palette
    const item = filteredGroups.flatMap((g) => g.items).find((i) => i.type === type);

    if (!item || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    let x = Math.round((e.clientX - rect.left) / zoom);
    let y = Math.round((e.clientY - rect.top) / zoom);
    if (snapOn) {
      x = Math.round(x / GRID_STEP) * GRID_STEP;
      y = Math.round(y / GRID_STEP) * GRID_STEP;
    }
    addComponent(item, x, y);
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== gridRef.current) return;
    setSelectedId(null);
  };

  useEffect(() => {
    const snap = (v: number) => (snapOn ? Math.round(v / GRID_STEP) * GRID_STEP : Math.round(v));

    function onMove(e: MouseEvent) {
      // --- Resizing ---
      const rz = resizeRef.current;
      if (rz) {
        const dx = (e.clientX - rz.startX) / zoom;
        const dy = (e.clientY - rz.startY) / zoom;
        const origRight = rz.origX + rz.origW;
        const origBottom = rz.origY + rz.origH;

        let left = rz.origX;
        let top = rz.origY;
        let right = origRight;
        let bottom = origBottom;

        // Only the edges being dragged move (and snap to the grid).
        if (rz.handle.includes('w')) left = snap(rz.origX + dx);
        if (rz.handle.includes('e')) right = snap(origRight + dx);
        if (rz.handle.includes('n')) top = snap(rz.origY + dy);
        if (rz.handle.includes('s')) bottom = snap(origBottom + dy);

        // Keep a minimum size, anchored to the edge that is not moving.
        if (rz.handle.includes('w')) left = Math.min(left, origRight - MIN_W);
        if (rz.handle.includes('e')) right = Math.max(right, rz.origX + MIN_W);
        if (rz.handle.includes('n')) top = Math.min(top, origBottom - MIN_H);
        if (rz.handle.includes('s')) bottom = Math.max(bottom, rz.origY + MIN_H);

        // Stay inside the page (without forcing already-overflowing fields to shrink).
        if (rz.handle.includes('w')) left = Math.max(0, left);
        if (rz.handle.includes('n')) top = Math.max(0, top);
        if (rz.handle.includes('e')) right = Math.min(right, Math.max(pageW, origRight));
        if (rz.handle.includes('s')) bottom = Math.min(bottom, Math.max(pageH, origBottom));

        const next = {
          x: Math.round(left),
          y: Math.round(top),
          w: Math.round(right - left),
          h: Math.round(bottom - top),
        };
        setElements((prev) => prev.map((el) => (el.id === rz.id ? { ...el, ...next } : el)));
        return;
      }

      // --- Dragging ---
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      let nx = Math.max(0, Math.round(drag.origX + dx / zoom));
      let ny = Math.max(0, Math.round(drag.origY + dy / zoom));
      if (snapOn) {
        nx = Math.round(nx / GRID_STEP) * GRID_STEP;
        ny = Math.round(ny / GRID_STEP) * GRID_STEP;
      }
      setElements((prev) => prev.map((el) => (el.id === drag.id ? { ...el, x: nx, y: ny } : el)));
    }
    function onUp() {
      dragRef.current = null;
      resizeRef.current = null;
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [zoom, snapOn, pageW, pageH]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const activeTag = (document.activeElement?.tagName ?? '').toUpperCase();
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
        deleteElement(selectedId);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, deleteElement, undo, redo]);

  // Expose data via ref
  useImperativeHandle(ref, () => ({
    getData: () => ({
      templateConfig: {
        elements,
        pageSize: templatePageSize,
      },
    }),
  }), [elements, templatePageSize]);

  const handleSave = async () => {
    const validationErrors = generalRef.current?.validate() ?? {};
    if (Object.keys(validationErrors).length > 0) {
      setActiveTab('general');
      setSaveError('Complete the required General fields before saving.');
      return;
    }

    if (mode !== 'edit' || !certificateType?.id) {
      setSaveError('Use the Save Changes button in Fees & Charges to create a new certificate type.');
      return;
    }

    setIsSavingCertificate(true);
    setSaveError(null);
    try {
      const formData = getFormData();
      const response = await apiFetch(`${getBaseUrl()}/api/v1/admin/certificate-types/${certificateType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          name: formData.name,
          description: formData.description,
          active: formData.active,
          applicableFields: formData.applicableFields,
          requiredDocuments: formData.requiredDocuments,
          numberingConfig: formData.numberingConfig,
          templateUrl: formData.templateUrl,
          certNumberPrefix: formData.certNumberPrefix,
          templateConfig: formData.templateConfig,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to update certificate type.');
      }
      setSaved(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaved(false), 1200);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to update certificate type.');
    } finally {
      setIsSavingCertificate(false);
    }
  };

  const handleSubmitCertificateType = () => {
    // Handle successful certificate type submission
    console.log('Certificate type submitted successfully');
  };

  // Function to collect all form data from child components
  const getFormData = () => {
    const generalData = generalRef.current?.getData();
    const applicableFieldsData = applicableFieldsRef.current?.getData();
    const requiredDocumentsData = requiredDocumentsRef.current?.getData();
    const memberingFormatData = memberingFormatRef.current?.getData();

    console.log('getFormData - generalData:', generalData);
    console.log('getFormData - applicableFieldsData:', applicableFieldsData);
    console.log('getFormData - requiredDocumentsData:', requiredDocumentsData);

    // Convert requiredDocuments from object to JSON string of array
    let requiredDocumentsString = "[\"COMMERCIAL_INVOICE\",\"PACKING_LIST\",\"BILL_OF_LADING\"]";
    if (requiredDocumentsData?.requiredDocuments) {
      // If it's an object with transport modes, flatten all documents into a single array
      if (typeof requiredDocumentsData.requiredDocuments === 'object' && !Array.isArray(requiredDocumentsData.requiredDocuments)) {
        const allDocs = Object.values(requiredDocumentsData.requiredDocuments).flat();
        requiredDocumentsString = JSON.stringify(allDocs);
      } else if (Array.isArray(requiredDocumentsData.requiredDocuments)) {
        requiredDocumentsString = JSON.stringify(requiredDocumentsData.requiredDocuments);
      }
    }

    // --------------------------------------------------------------
    // Build templateConfig for the backend.
    //
    // FIX: the backend's `fields` map is keyed by the field CODE
    // (e.g. "SHIPPER_NAME", "TIN") — the same codes used in
    // `applicableFields` / `FIELD_ID_MAP` — not by the canvas
    // element's internal `id` (e.g. "el_7"). The internal id is an
    // in-memory counter that resets on every page load and carries
    // no meaning outside this component, so the backend/renderer had
    // no way to resolve it back to an actual field. We now key by
    // `backendFieldCode(element.text)` instead.
    //
    // Font/align are also uppercased to match the backend's enum
    // style seen in the sample payload ("HELVETICA", "LEFT", ...).
    // --------------------------------------------------------------
    const fields: any = {};
    // TODO(backend): the "Goods Table" is currently a single draggable
    // placeholder (kind === 'goods') on the canvas, but the backend's
    // templateConfig schema expects a `goods` object with per-column
    // placement data (goods.columns.VALUE, ITEM_NO, CRITERIA, MARKS_NO,
    // ...) plus goods.minY / goods.startY. There's no UI yet to place
    // individual goods columns, so we deliberately do NOT fabricate
    // this data. If a goods-table element is enabled, we surface a
    // console warning so it isn't silently dropped without anyone
    // noticing. This needs a product/design follow-up (either add a
    // per-column goods UI, or have the backend accept a single table
    // region and lay out columns itself).
    let hasUnmappedGoodsTable = false;

    elements.forEach((element) => {
      if (element.kind === 'component') return;

      if (element.kind === 'goods') {
        hasUnmappedGoodsTable = true;
        return;
      }

      const code = backendFieldCode(element.text);
      fields[code] = {
        x: element.x,
        y: element.y,
        width: element.w,
        height: element.h || 20,
        fontSize: element.fontSize || 10,
        font: (element.fontFamily || 'HELVETICA').toUpperCase(),
        align: (element.align || 'left').toUpperCase(),
        wrap: element.wrap || false,
      };
    });

    if (hasUnmappedGoodsTable) {
      // eslint-disable-next-line no-console
      console.warn(
        '[TemplateDesigner] A Goods Table element is on the canvas but is not included in the saved ' +
        'templateConfig.fields payload — the backend expects per-column goods placement data ' +
        '(goods.columns.*, goods.minY, goods.startY) that this canvas does not yet collect.'
      );
    }

    const templateConfigObj: any = {
      page: {
        index: generalData?.pageIndex || 0,
        width: generalData?.pageSize?.width || pageW,
        height: generalData?.pageSize?.height || pageH,
      },
      fields,
      // Retain the complete canvas model (including UI-only metadata like
      // color, kind, badges, etc.) so the designer can reopen and re-edit
      // exactly what was there. NOTE: confirm with backend that this key
      // is persisted as-is and not stripped by templateConfig validation —
      // if it's dropped, editing an existing certificate will lose its
      // saved layout (see elements-reload effect above).
      elements,
    };

    // Convert templateConfig to JSON string
    const templateConfigString = JSON.stringify(templateConfigObj);

    // Convert applicableFields from object to array of enabled field names
    const applicableFieldsArray = applicableFieldsData?.enabledFields
      ? Object.keys(applicableFieldsData.enabledFields).filter(key => applicableFieldsData.enabledFields[key] === true)
      : [];

    const result = {
      code: generalData?.code,
      name: generalData?.displayName,
      description: generalData?.description,
      active: generalData?.status === 'active',
      applicableFields: applicableFieldsArray,
      requiredDocuments: requiredDocumentsString,
      numberingConfig: memberingFormatData?.numberingConfig,
      templateConfig: templateConfigString,
      templateFileName: generalData?.templateFileName,
      pageIndex: generalData?.pageIndex,
      pageSize: generalData?.pageSize,
      certNumberPrefix: generalData?.certPrefix,
      templateUrl: generalData?.templateUrl,
    };

    console.log('getFormData - final result:', result);
    return result;
  };

  const handleFitWidth = useCallback(() => {
    const container = canvasScrollRef.current;
    if (!container) return;
    const available = container.clientWidth - 48;
    const next = Math.min(2, Math.max(0.4, available / pageW));
    setZoom(Math.round(next * 100) / 100);
  }, [pageW]);

  // FIX: the canvas used to always start at a fixed 90% zoom, no matter
  // how much screen space was actually available. On a wide monitor that
  // comfortably fits the whole page -- and every already-placed field
  // with it. On a smaller laptop screen the same fixed zoom made the page
  // wider than the visible canvas area, so part of the page (and
  // whichever fields happened to sit in that cut-off region) was pushed
  // outside the visible area and only reachable by scrolling. The fields
  // were never actually in different positions -- they're exactly where
  // they were saved -- but only seeing a portion of the page at a time
  // looks like everything is scattered. Auto-fitting the zoom to the
  // available viewport, on load, whenever the page size becomes known,
  // and whenever the window is resized, keeps the whole template (and
  // every field on it) framed consistently no matter the screen size.
  useEffect(() => {
    handleFitWidth();
  }, [handleFitWidth]);

  useEffect(() => {
    let frame: number | null = null;
    const onResize = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => handleFitWidth());
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [handleFitWidth]);

  const handleReset = () => {
    commit(() => []);
    setSelectedId(null);
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    // If API fields are loaded, use them to build dynamic palette
    if (apiFields.length > 0) {
      // Group fields by category
      const grouped = apiFields.reduce((acc, field) => {
        if (!field.applicable) return acc; // Skip non-applicable fields

        const category = field.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(field);
        return acc;
      }, {} as Record<string, ApiField[]>);

      // Convert to palette groups
      const groups = Object.entries(grouped).map(([category, fields]) => ({
        label: category,
        items: fields.map(apiFieldToPaletteItem),
      }));

      // Filter by enabled fields and search
      return groups
        .map((g) => {
          let filteredItems = g.items.filter((i) => {
            const isEnabled = enabledFields[i.type] !== false;
            return isEnabled;
          });

          if (q) {
            filteredItems = filteredItems.filter((i) => i.label.toLowerCase().includes(q));
          }

          return { ...g, items: filteredItems };
        })
        .filter((g) => g.items.length > 0);
    }

    // Fallback to hardcoded palette if API fields not loaded
    return FULL_PALETTE_GROUPS.map((g) => {
      let filteredItems = g.items;

      if (g.label === 'Application Fields') {
        filteredItems = g.items.filter((i) => {
          const fieldId = FIELD_ID_MAP[i.type] || i.type;
          const isEnabled = enabledFields[fieldId] !== false;
          return isEnabled;
        });
      }

      if (q) {
        filteredItems = filteredItems.filter((i) => i.label.toLowerCase().includes(q));
      }

      return { ...g, items: filteredItems };
    }).filter((g) => g.items.length > 0);
  }, [search, enabledFields, apiFields]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f7fb]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#dde3ee] bg-white">
        <div>
          <h1 className="text-[18px] font-semibold text-[#1a2236] flex items-center gap-2">
            {mode === 'create' ? 'Add Certificate Type' : 'Edit Certificate Type'}
            <span className="text-[11px] font-semibold text-green-800 bg-green-100 border border-green-600 px-2 py-0.5 rounded-full">
              Active
            </span>
          </h1>
          <p className="text-[12px] text-[#6a7a9a] mt-0.5">
            Design the certificate template by placing and configuring fields.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label className="text-[13px] text-[#6a7a9a] font-medium">Certificate type</label>
            <div className="px-3 py-1.5 border border-[#d1d5db] rounded text-[13px] min-w-[200px] bg-[#f8fafd] text-[#3a4560]">
              {certificateType ? `${certificateType.name} (${certificateType.code})` : 'New certificate type'}
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 border border-[#d1d5db] rounded text-[13px] font-medium hover:bg-[#f4f5f7] flex items-center gap-1"
            onClick={() => setShowPreview(true)}
          >
            Preview PDF
          </button>
          <button
            className={`px-3 py-1.5 rounded text-[13px] font-medium flex items-center gap-1 transition-colors ${
              saved ? 'bg-[#1f8a44] text-white' : 'bg-[#1a4a8a] text-white hover:bg-[#153c70]'
            }`}
            onClick={handleSave}
            disabled={isSavingCertificate}
            aria-busy={isSavingCertificate}
          >
            <FiSave size={14} /> {isSavingCertificate ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
          </button>
          <button className="p-2 border border-[#d1d5db] rounded hover:bg-[#f4f5f7]">
            <FiMoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 px-4 py-3 bg-white border-b border-[#dde3ee]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-[13px] cursor-pointer font-medium rounded transition-all ${
              activeTab === tab.id
                ? 'border-t-2 shadow border-t-[#1a4a8a] font-semibold text-[#1a4a8a] bg-white'
                : 'bg-[#f4f5f7] text-[#4a5a7a] hover:bg-[#e8eef5]'
            }`}
            onClick={() => {
              if (activeTab === 'template-designer' && hasUnsavedChanges) {
                setPendingTab(tab.id);
                setShowUnsavedWarning(true);
              } else {
                setActiveTab(tab.id);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showUnsavedWarning && (
        <div className="fixed bottom-4 right-4 bg-white border border-[#fbbf24] rounded-lg shadow-lg p-4 z-50 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="text-[#f59e0b] text-xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Unsaved Changes</h4>
              <p className="text-xs text-gray-600 mb-3">You have unsaved changes to the template. Please save before switching tabs.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUnsavedWarning(false);
                    setPendingTab(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setShowUnsavedWarning(false);
                    setHasUnsavedChanges(false);
                    setPendingTab(null);
                    // Reload elements from certificate type to discard changes
                    reloadElementsFromCertificateType();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#f59e0b] rounded hover:bg-[#d97706]"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-[#f9fafb]">
        {saveError && (
          <div className="mx-6 mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {saveError}
          </div>
        )}
        <div className={activeTab === 'general' ? '' : 'hidden'}>
          <General ref={generalRef} onTabChange={setActiveTab} certificateType={certificateType} />
        </div>
        <div className={activeTab === 'applicable-fields' ? '' : 'hidden'}>
          <ApplicableFields ref={applicableFieldsRef} onTabChange={setActiveTab} certificateType={certificateType} />
        </div>
        <div className={activeTab === 'required-documents' ? '' : 'hidden'}>
          <RequiredDocuments ref={requiredDocumentsRef} certificateType={certificateType} onTabChange={setActiveTab} />
        </div>
        <div className={activeTab === 'numbering-format' ? '' : 'hidden'}>
          <MemberingFormat ref={memberingFormatRef} certificateType={certificateType} onTabChange={setActiveTab} />
        </div>
        <div className={activeTab === 'Fee' ? '' : 'hidden'}>
          <FeeCharges ref={feeChargesRef} onTabChange={setActiveTab} onSubmit={handleSubmitCertificateType} certificateType={certificateType} mode={mode} getFormData={getFormData} />
        </div>
      </div>

      {activeTab === 'template-designer' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#dde3ee] bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#d1d5db] rounded overflow-hidden">
                <button
                  className="px-2.5 py-1.5 hover:bg-[#f4f5f7] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  onClick={undo}
                  disabled={past.length === 0}
                  title="Undo (Ctrl+Z)"
                >
                  <FiCornerUpLeft size={15} className="text-[#3a4560]" />
                </button>
                <div className="w-px h-4 bg-[#d1d5db]" />
                <button
                  className="px-2.5 py-1.5 hover:bg-[#f4f5f7] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  onClick={redo}
                  disabled={future.length === 0}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <FiCornerUpRight size={15} className="text-[#3a4560]" />
                </button>
              </div>

              <div className="w-px h-6 bg-[#dde3ee] mx-1" />

              <div className="flex items-center border border-[#d1d5db] rounded overflow-hidden">
                <button
                  className="px-2 py-1.5 hover:bg-[#e8f0fe] transition-colors"
                  onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 100) / 100))}
                  title="Zoom out"
                >
                  <FiZoomOut size={15} className="text-[#1a4a8a]" />
                </button>
                <div className="w-px h-3 bg-[#d1d5db]" />
                <span className="px-3 text-[13px] font-medium text-[#1a2236] min-w-[52px] text-center tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <div className="w-px h-3 bg-[#d1d5db]" />
                <button
                  className="px-2 py-1.5 hover:bg-[#e8f0fe] transition-colors"
                  onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 100) / 100))}
                  title="Zoom in"
                >
                  <FiZoomIn size={15} className="text-[#1a4a8a]" />
                </button>
              </div>
              <button
                className="px-2.5 py-1.5 border border-[#d1d5db] rounded text-[12px] font-medium text-[#1a2236] hover:bg-[#e8f0fe] hover:border-[#1a4a8a] transition-all"
                onClick={handleFitWidth}
              >
                Fit Width
              </button>
            </div>

            <div className="flex items-center gap-5">
              <SwitchField label="Grid" checked={gridOn} onChange={setGridOn} />
              <SwitchField label="Snap" checked={snapOn} onChange={setSnapOn} />
              <div className="w-px h-6 bg-[#dde3ee]" />
              <button className="p-2 border border-[#d1d5db] rounded-lg hover:bg-[#f4f5f7] transition-colors" title="Canvas settings">
                <FiSettings size={16} className="text-[#3a4560]" />
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex overflow-hidden">
            {/* Palette */}
            <div className="w-72 border-r border-[#dde3ee] bg-white overflow-y-auto shrink-0">
              <div className="p-4 border-b border-[#dde3ee]">
                <h2 className="text-[15px] font-semibold text-[#1a2236] mb-1">Palette</h2>
                <p className="text-[12px] text-[#6a7a9a] mb-3">Drag fields or components to the template</p>
                <div className="relative">
                  <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa5bb]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search fields..."
                    className="w-full pl-8 pr-2.5 py-1.5 border border-[#d1d5db] rounded text-[12.5px] outline-none focus:border-[#1a4a8a] focus:ring-2 focus:ring-[#e8f0fe] transition-colors"
                  />
                </div>
              </div>

              <div className="p-4">
                {filteredGroups.map((group) => {
                  const isAppGroup = group.label === 'Application Fields' && !search;
                  const visibleItems =
                    isAppGroup && !showAllApplicationFields
                      ? group.items.slice(0, APPLICATION_FIELDS_VISIBLE)
                      : group.items;

                  return (
                    <div key={group.label}>
                      <div className="text-[10.5px] font-bold text-[#1a4a8a] uppercase tracking-wider mb-2.5 mt-5 first:mt-0">
                        {group.label}
                      </div>
                      <div className="space-y-1.5">
                        {visibleItems.map((item) => (
                          <PaletteRow key={item.type} item={item} onAdd={() => addComponent(item)} />
                        ))}
                      </div>
                      {isAppGroup && group.items.length > APPLICATION_FIELDS_VISIBLE && (
                        <button
                          className="mt-2 text-[12px] font-semibold text-[#1a4a8a] hover:underline"
                          onClick={() => setShowAllApplicationFields((v) => !v)}
                        >
                          {showAllApplicationFields ? 'Show less' : `View all (${TOTAL_ENABLED_FIELDS} enabled fields)`}
                        </button>
                      )}
                    </div>
                  );
                })}
                {filteredGroups.length === 0 && (
                  <p className="text-[12px] text-[#9aa5bb] text-center py-8">No fields match &ldquo;{search}&rdquo;.</p>
                )}

                <div className="mt-6 p-3.5 bg-gradient-to-br from-[#e8f0fe] to-[#f0f7ff] rounded-xl border border-[#d4e6fd]">
                  <div className="flex items-start gap-2">
                    <span className="text-[#1a4a8a] text-sm">💡</span>
                    <div className="text-[11.5px] text-[#1a2236] leading-relaxed">
                      <strong className="text-[#1a4a8a]">Tip:</strong> Drag a component onto the template. Click it to
                      edit properties, then drag its edges or corners to resize.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={canvasScrollRef}
              className="flex-1 bg-[#eef0f4] overflow-auto flex justify-center items-start p-8"
            >
              <div
                className="bg-white shadow-[0_1px_3px_rgba(20,30,60,0.08),0_12px_32px_rgba(20,30,60,0.10)] relative rounded-md shrink-0"
                style={{
                  width: pageW * zoom,
                  height: pageH * zoom,
                }}
              >
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                  <div
                    ref={gridRef}
                    className="relative"
                    style={{
                      width: pageW,
                      height: pageH,
                      backgroundImage: gridOn
                        ? 'linear-gradient(to right, #eef1f6 1px, transparent 1px), linear-gradient(to bottom, #eef1f6 1px, transparent 1px)'
                        : undefined,
                      backgroundSize: `${GRID_STEP}px ${GRID_STEP}px`,
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropOnCanvas}
                    onMouseDown={onCanvasMouseDown}
                  >
                    {/* PDF template background, if one was uploaded in the General tab */}
                    {templateDataUrl && (
                      <iframe
                        src={`${templateDataUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                        title="Template Preview"
                      />
                    )}

                    {/* Draggable + resizable field elements */}
                    {elements.map((el) => {
                      const isSelected = el.id === selectedId;
                      const kindColors = kindPalette(el.kind);
                      // Handle/badge sizes are divided by zoom so they stay
                      // the same size on screen at any zoom level.
                      const handleSize = 9 / zoom;
                      return (
                        // Outer wrapper: position + size, NOT clipped so handles can sit on the edges.
                        <div
                          key={el.id}
                          className="absolute select-none"
                          style={{
                            left: el.x,
                            top: el.y,
                            width: el.w,
                            height: el.h,
                            opacity: el.enabled ? 1 : 0.4,
                            zIndex: isSelected ? 20 : 1,
                          }}
                        >
                          {/* Inner box: the visible field (clipped) */}
                          <div
                            className={`w-full h-full cursor-move overflow-hidden flex ${
                              isSelected ? 'ring-2 ring-[#1a4a8a] ring-offset-1' : ''
                            }`}
                            onMouseDown={(e) => onElMouseDown(e, el)}
                            style={{
                              fontSize: el.fontSize,
                              lineHeight: (el.leading / el.fontSize).toFixed(2),
                              fontFamily: el.fontFamily,
                              fontWeight: el.bold ? 700 : 600,
                              fontStyle: el.italic ? 'italic' : 'normal',
                              textDecoration: el.underline ? 'underline' : 'none',
                              justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
                              alignItems: el.valign === 'top' ? 'flex-start' : el.valign === 'bottom' ? 'flex-end' : 'center',
                              color: el.color,
                              background: el.bg,
                              border: `1.4px ${el.border === 'none' ? 'solid' : el.border} ${
                                el.border === 'none' ? kindColors.border : el.borderColor
                              }`,
                              borderRadius: 4,
                              padding: `${el.pad.t}px ${el.pad.r}px ${el.pad.b}px ${el.pad.l}px`,
                              whiteSpace: el.wrap ? 'pre-wrap' : 'nowrap',
                            }}
                          >
                            {el.imageUrl ? (
                              <img src={el.imageUrl} alt={el.text} className="w-full h-full object-contain" />
                            ) : el.typeLabel === 'QR Code' ? (
                              <QrGlyph />
                            ) : (
                              el.text
                            )}
                          </div>

                          {/* Resize handles + live size readout (selected only) */}
                          {isSelected && (
                            <>
                              {RESIZE_HANDLES.map((h) => (
                                <div
                                  key={h.key}
                                  onMouseDown={(e) => onResizeMouseDown(e, el, h.key)}
                                  className="absolute bg-white"
                                  style={{
                                    width: handleSize,
                                    height: handleSize,
                                    left: h.left,
                                    top: h.top,
                                    transform: 'translate(-50%, -50%)',
                                    cursor: h.cursor,
                                    border: `${1.5 / zoom}px solid #1a4a8a`,
                                    borderRadius: 2 / zoom,
                                    zIndex: 30,
                                  }}
                                />
                              ))}
                              <div
                                className="absolute left-0 whitespace-nowrap bg-[#1a4a8a] text-white pointer-events-none"
                                style={{
                                  top: '100%',
                                  marginTop: 8 / zoom,
                                  fontSize: 10 / zoom,
                                  lineHeight: 1.2,
                                  padding: `${2 / zoom}px ${5 / zoom}px`,
                                  borderRadius: 3 / zoom,
                                  fontFamily: 'Helvetica, Arial, sans-serif',
                                  fontWeight: 500,
                                }}
                              >
                                {el.w} × {el.h}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Properties panel */}
            <div className="w-[320px] border-l border-[#dde3ee] bg-white overflow-y-auto shrink-0">
              <div className="flex items-center justify-between p-4 border-b border-[#dde3ee]">
                <h2 className="text-[12px] font-medium text-[#1a2236]">Component Properties</h2>
                {selected && (
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1 border border-[#f0b4b0] text-[#dc2626] rounded text-[11.5px] font-semibold hover:bg-[#fdeceb] transition-colors"
                    onClick={() => deleteElement(selected.id)}
                  >
                    <FiTrash2 size={12} /> Delete Component
                  </button>
                )}
              </div>

              <div className="p-4">
                {!selected ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-16 h-16 bg-[#f9fafb] rounded-full flex items-center justify-center mb-4">
                      <FiEye size={22} className="text-[#9ca3af]" />
                    </div>
                    <p className="text-[13px] text-[#6a7a9a] leading-relaxed max-w-[220px]">
                      Select a component on the template to edit its position, size, typography and colors here.
                    </p>
                  </div>
                ) : (
                  <PropertiesForm
                    el={selected}
                    onChange={updateSelected}
                    onChangePad={updateSelectedPad}
                    openBorder={openBorderSection}
                    setOpenBorder={setOpenBorderSection}
                    openAdvanced={openAdvancedSection}
                    setOpenAdvanced={setOpenAdvancedSection}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-2 border-t border-[#dde3ee] bg-white text-[11.5px] text-[#6a7a9a]">
            <div className="flex items-center gap-4">
              <span>Page 1 of 1</span>
              <span className="text-[#dde3ee]">|</span>
              <span>
                Paper: {pageW} x {pageH} pt
              </span>
              <span className="text-[#dde3ee]">|</span>
              <span>Units: PDF Points (pt)</span>
              <span className="text-[#dde3ee]">|</span>
              <span>Components: {elements.length}</span>
            </div>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#d1d5db] rounded text-[12.5px] font-medium text-[#3a4560] hover:bg-[#f4f5f7] transition-colors"
                onClick={handleReset}
              >
                <FiRefreshCw size={12} /> Reset
              </button>
              <button
                type="button"
                className="px-3.5 py-1.5 border border-[#d1d5db] rounded text-[12.5px] font-medium text-[#3a4560] hover:bg-[#f4f5f7] transition-colors"
                onClick={() => setShowPreview(true)}
              >
                Preview PDF
              </button>
              {/* <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a4a8a] text-white rounded text-[12.5px] font-medium hover:bg-[#2a5a9a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmitCertificateType}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Certificate Type'}
              </button> */}
            </div>
          </div>

        </>
      )}

      {showPreview && (
        <PreviewModal
          elements={elements}
          pageW={pageW}
          pageH={pageH}
          templateDataUrl={templateDataUrl}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
});

TemplateDesigner.displayName = 'TemplateDesigner';

export { TemplateDesigner };

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function QrGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full p-1" fill="currentColor">
      {[
        [0, 0], [0, 4], [0, 8], [4, 0], [8, 0], [4, 8], [8, 8],
        [16, 0], [20, 4], [24, 0], [16, 8], [24, 8],
        [0, 16], [4, 16], [0, 20], [8, 24], [0, 32], [4, 32], [8, 32], [0, 36], [8, 36],
        [16, 16], [20, 20], [24, 16], [16, 24], [24, 24], [20, 32], [16, 36], [24, 36],
        [32, 0], [36, 4], [32, 8], [32, 16], [36, 20], [32, 24], [32, 32], [36, 32], [32, 36], [36, 36],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={3.4} height={3.4} />
      ))}
    </svg>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#e5e8f0] rounded-lg mb-3 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#f9fafc] hover:bg-[#f2f4f8] transition-colors"
      >
        <span className="text-[12.5px] font-semibold text-[#1a2236]">{title}</span>
        {open ? <FiChevronDown size={14} className="text-[#6a7a9a]" /> : <FiChevronRight size={14} className="text-[#6a7a9a]" />}
      </button>
      {open && <div className="p-3 border-t border-[#e5e8f0]">{children}</div>}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="block text-[10.5px] text-[#6a7a9a] mb-1">{label}</label>
      <div className="flex items-center border border-[#d1d5db] rounded overflow-hidden">
        <input
          type="number"
          className="w-full px-2 py-1.5 text-[12px] outline-none"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && <span className="px-2 text-[10.5px] text-[#9aa5bb]">{suffix}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Properties panel                                                    */
/* ------------------------------------------------------------------ */

function PropertiesForm({
  el,
  onChange,
  onChangePad,
  openBorder,
  setOpenBorder,
  openAdvanced,
  setOpenAdvanced,
}: {
  el: FieldElement;
  onChange: (patch: Partial<FieldElement>) => void;
  onChangePad: (patch: Partial<Padding>) => void;
  openBorder: boolean;
  setOpenBorder: (v: boolean) => void;
  openAdvanced: boolean;
  setOpenAdvanced: (v: boolean) => void;
}) {
  const fontFamilies = ['Helvetica', 'Arial', 'Times New Roman', 'Courier New', 'Georgia'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) onChange({ imageUrl: event.target.result as string });
    };
    reader.readAsDataURL(file);
  };

  const isPlainStyle = !el.bold && !el.italic && !el.underline;

  return (
    <div>
      {/* Selected field */}
      <div className="mb-4">
        <div className="text-[10.5px] font-semibold text-[#9aa5bb] uppercase tracking-wide mb-1.5">Selected Field</div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[13.5px] font-bold text-[#1a2236] break-words">{el.text}</span>
          <button
            type="button"
            onClick={() => onChange({ enabled: !el.enabled })}
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors ${
              el.enabled ? 'bg-[#e9f7ee] border-[#8fc99c] text-[#1f6b32]' : 'bg-[#f3f4f6] border-[#d1d5db] text-[#6a7a9a]'
            }`}
          >
            {el.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        <div className="mb-2">
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Display Label</label>
          <input
            type="text"
            value={el.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[11.5px] focus:border-[#1a4a8a] focus:ring-2 focus:ring-[#e8f0fe] outline-none transition-colors"
            placeholder="Enter display label"
          />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#6a7a9a]">
          <span>
            Type: <span className="font-medium text-[#3a4560]">{el.typeLabel}</span>
          </span>
          <span>
            Source: <span className="font-medium text-[#3a4560]">{el.source}</span>
          </span>
        </div>
      </div>

      {el.typeLabel === 'Image' && (
        <div className="mb-4">
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-[11.5px]" />
        </div>
      )}

      {/* Position & Size */}
      <SectionLabel>Position &amp; Size (PDF Points)</SectionLabel>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <NumberField label="X" value={el.x} onChange={(v) => onChange({ x: v })} />
        <NumberField label="Y" value={el.y} onChange={(v) => onChange({ y: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-1">
        <NumberField label="Width" value={el.w} onChange={(v) => onChange({ w: v })} />
        <NumberField label="Height" value={el.h} onChange={(v) => onChange({ h: v })} />
      </div>
      <p className="text-[10.5px] text-[#9aa5bb] mb-4">
        Tip: you can also drag the handles on the canvas to resize.
      </p>

      {/* Typography */}
      <SectionLabel>Typography</SectionLabel>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="col-span-1">
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Font Family</label>
          <select
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[11.5px]"
            value={el.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
          >
            {fontFamilies.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <NumberField label="Font Size" value={el.fontSize} onChange={(v) => onChange({ fontSize: v })} suffix="pt" />
        <NumberField label="Line Spacing" value={el.leading} onChange={(v) => onChange({ leading: v })} suffix="pt" />
      </div>

      <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Font Style</label>
      <div className="flex border border-[#d1d5db] rounded overflow-hidden mb-3">
        <button
          className={`flex-1 py-1.5 text-[11.5px] font-medium border-r border-[#d1d5db] transition-colors ${
            isPlainStyle ? 'bg-[#e8f0fe] text-[#1a4a8a]' : 'hover:bg-[#f4f5f7] text-[#3a4560]'
          }`}
          onClick={() => onChange({ bold: false, italic: false, underline: false })}
        >
          Normal
        </button>
        <button
          className={`flex-1 py-1.5 text-[11.5px] font-bold border-r border-[#d1d5db] transition-colors ${
            el.bold ? 'bg-[#e8f0fe] text-[#1a4a8a]' : 'hover:bg-[#f4f5f7] text-[#3a4560]'
          }`}
          onClick={() => onChange({ bold: !el.bold })}
        >
          Bold
        </button>
        <button
          className={`flex-1 py-1.5 text-[11.5px] italic border-r border-[#d1d5db] transition-colors ${
            el.italic ? 'bg-[#e8f0fe] text-[#1a4a8a]' : 'hover:bg-[#f4f5f7] text-[#3a4560]'
          }`}
          onClick={() => onChange({ italic: !el.italic })}
        >
          Italic
        </button>
        <button
          className={`flex-1 py-1.5 text-[11.5px] underline transition-colors ${
            el.underline ? 'bg-[#e8f0fe] text-[#1a4a8a]' : 'hover:bg-[#f4f5f7] text-[#3a4560]'
          }`}
          onClick={() => onChange({ underline: !el.underline })}
        >
          Underline
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Text Align</label>
          <div className="flex border border-[#d1d5db] rounded overflow-hidden">
            {(
              [
                ['left', FiAlignLeft],
                ['center', FiAlignCenter],
                ['right', FiAlignRight],
              ] as [Align, IconType][]
            ).map(([a, Ico]) => (
              <button
                key={a}
                className={`flex-1 py-1.5 flex items-center justify-center border-r border-[#d1d5db] last:border-r-0 transition-colors ${
                  el.align === a ? 'bg-[#e8f0fe] text-[#1a4a8a]' : 'hover:bg-[#f4f5f7] text-[#6a7a9a]'
                }`}
                onClick={() => onChange({ align: a })}
              >
                <Ico size={13} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Vertical Align</label>
          <div className="flex border border-[#d1d5db] rounded overflow-hidden">
            {(['top', 'middle', 'bottom'] as VAlign[]).map((v) => (
              <button
                key={v}
                className={`flex-1 py-1.5 flex items-center justify-center border-r border-[#d1d5db] last:border-r-0 text-[11px] font-semibold transition-colors ${
                  el.valign === v ? 'bg-[#e8f0fe] text-[#1a4a8a]' : 'hover:bg-[#f4f5f7] text-[#6a7a9a]'
                }`}
                onClick={() => onChange({ valign: v })}
                title={v}
              >
                {v === 'top' ? '⤒' : v === 'bottom' ? '⤓' : '↕'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Text Color</label>
          <div className="flex items-center gap-2 border border-[#d1d5db] rounded px-2 py-1">
            <input
              type="color"
              className="w-5 h-5 border-0 p-0 rounded cursor-pointer"
              value={el.color}
              onChange={(e) => onChange({ color: e.target.value })}
            />
            <span className="text-[11px] text-[#6a7a9a] uppercase truncate">{el.color}</span>
          </div>
        </div>
        <div>
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Background</label>
          <div className="flex items-center gap-2 border border-[#d1d5db] rounded px-2 py-1">
            <input
              type="color"
              className="w-5 h-5 border-0 p-0 rounded cursor-pointer"
              value={el.bg === 'transparent' ? '#ffffff' : el.bg}
              onChange={(e) => onChange({ bg: e.target.value })}
            />
            <span className="text-[11px] text-[#6a7a9a] uppercase truncate">{el.bg}</span>
          </div>
        </div>
      </div>

      {/* Behaviour */}
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-[12px] text-[#3a4560]">
          <input type="checkbox" checked={el.wrap} onChange={(e) => onChange({ wrap: e.target.checked })} className="w-3.5 h-3.5" />
          Wrap Text
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#6a7a9a]">Max Lines</span>
          <input
            type="number"
            disabled={!el.wrap}
            className="w-12 px-1.5 py-1 border border-[#d1d5db] rounded text-[11px] text-center disabled:bg-[#f3f4f6] disabled:text-[#b0b8c8]"
            value={el.maxLines}
            onChange={(e) => onChange({ maxLines: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="flex items-center gap-6 mb-4">
        <label className="flex items-center gap-2 text-[12px] text-[#3a4560]">
          <input type="checkbox" checked={el.required} onChange={(e) => onChange({ required: e.target.checked })} className="w-3.5 h-3.5" />
          Required Field
        </label>
        <label className="flex items-center gap-2 text-[12px] text-[#3a4560]">
          <input type="checkbox" checked={el.readOnly} onChange={(e) => onChange({ readOnly: e.target.checked })} className="w-3.5 h-3.5" />
          Read Only
        </label>
      </div>

      {/* Border & Padding */}
      <CollapsibleSection title="Border & Padding (Optional)" open={openBorder} onToggle={() => setOpenBorder(!openBorder)}>
        <div className="mb-3">
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Border Style</label>
          <select
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[11.5px]"
            value={el.border}
            onChange={(e) => onChange({ border: e.target.value as BorderStyle })}
          >
            <option value="none">None</option>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Border Color</label>
          <div className="flex items-center gap-2 border border-[#d1d5db] rounded px-2 py-1">
            <input
              type="color"
              className="w-5 h-5 border-0 p-0 rounded cursor-pointer"
              value={el.borderColor}
              onChange={(e) => onChange({ borderColor: e.target.value })}
            />
            <span className="text-[11px] text-[#6a7a9a] uppercase">{el.borderColor}</span>
          </div>
        </div>
        <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Padding</label>
        <div className="grid grid-cols-4 gap-1">
          {(
            [
              ['t', 'Top'],
              ['r', 'Right'],
              ['b', 'Bottom'],
              ['l', 'Left'],
            ] as [keyof Padding, string][]
          ).map(([key, lab]) => (
            <div key={key}>
              <label className="block text-[9px] text-[#9aa5bb] text-center mb-1">{lab}</label>
              <input
                type="number"
                className="w-full px-1 py-1 border border-[#d1d5db] rounded text-[11px] text-center"
                value={el.pad[key]}
                onChange={(e) => onChangePad({ [key]: Number(e.target.value) } as Partial<Padding>)}
              />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Advanced */}
      <CollapsibleSection title="Advanced (Cover, Conditional, etc.)" open={openAdvanced} onToggle={() => setOpenAdvanced(!openAdvanced)}>
        <label className="flex items-center gap-2 text-[12px] text-[#3a4560] mb-3">
          <input type="checkbox" checked={el.repeated} onChange={(e) => onChange({ repeated: e.target.checked })} className="w-3.5 h-3.5" />
          Repeated field (per goods line)
        </label>
        <div className="mb-3">
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Cover / Background Image</label>
          <label className="flex items-center justify-center gap-2 border border-dashed border-[#d1d5db] rounded py-2.5 text-[11.5px] text-[#6a7a9a] cursor-pointer hover:border-[#1a4a8a] hover:text-[#1a4a8a] transition-colors">
            <FiUpload size={13} /> Upload image
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
        <div>
          <label className="block text-[10.5px] text-[#6a7a9a] mb-1">Conditional Logic</label>
          <textarea
            rows={2}
            placeholder="e.g. Show only when Mode of Transport = Sea"
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[11.5px] outline-none focus:border-[#1a4a8a] resize-none"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10.5px] font-bold text-[#1a4a8a] uppercase tracking-wide mb-2">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Template preview                                                    */
/* ------------------------------------------------------------------ */

// Stand-in values so the preview reads like a filled-in certificate.
function sampleValueFor(el: FieldElement): string {
  const key = el.text.toLowerCase();
  if (key.includes('certificatenumber') || key.includes('certificate_number')) return 'CERT-2026-000123';
  if (key.includes('verification')) return 'VC-8F2A-91XD';
  if (key.includes('approval')) return 'APR-2026-004512';
  switch (el.typeLabel) {
    case 'Date':
      return new Date().toLocaleDateString('en-GB');
    case 'Number':
      return '1,250.00';
    case 'Email':
      return 'importer@example.com';
    case 'Checkbox':
      return '✓';
    case 'Verification Code':
      return 'VC-8F2A-91XD';
    default:
      return el.label || el.text;
  }
}

function PreviewModal({
  elements,
  pageW,
  pageH,
  templateDataUrl,
  onClose,
}: {
  elements: FieldElement[];
  pageW: number;
  pageH: number;
  templateDataUrl: string | null;
  onClose: () => void;
}) {
  const [showBoxes, setShowBoxes] = useState(false);
  const [scale, setScale] = useState(() =>
    typeof window === 'undefined'
      ? 0.9
      : Math.round(Math.max(0.4, Math.min(1, (Math.min(window.innerWidth, 1100) - 120) / pageW)) * 100) / 100
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Disabled components are left out, as they would be on the generated certificate.
  const visible = elements.filter((e) => e.enabled);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Template preview"
        className="flex flex-col w-full max-w-[1100px] max-h-full bg-white rounded-lg shadow-xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#dde3ee]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1a2236]">Template preview</h2>
            <p className="text-[11.5px] text-[#6a7a9a]">
              Fields are shown with sample values. {visible.length} field{visible.length === 1 ? '' : 's'} placed.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SwitchField label="Show field boxes" checked={showBoxes} onChange={setShowBoxes} />
            <div className="flex items-center border border-[#d1d5db] rounded overflow-hidden">
              <button
                type="button"
                className="px-2 py-1.5 hover:bg-[#e8f0fe] transition-colors"
                onClick={() => setScale((z) => Math.max(0.4, Math.round((z - 0.1) * 100) / 100))}
                title="Zoom out"
              >
                <FiZoomOut size={15} className="text-[#1a4a8a]" />
              </button>
              <span className="px-3 text-[13px] font-medium text-[#1a2236] min-w-[52px] text-center tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                className="px-2 py-1.5 hover:bg-[#e8f0fe] transition-colors"
                onClick={() => setScale((z) => Math.min(2, Math.round((z + 0.1) * 100) / 100))}
                title="Zoom in"
              >
                <FiZoomIn size={15} className="text-[#1a4a8a]" />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 border border-[#d1d5db] rounded hover:bg-[#f4f5f7]"
              aria-label="Close preview"
              title="Close (Esc)"
            >
              <FiX size={16} className="text-[#3a4560]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#eef0f4] p-6 flex justify-center items-start">
          <div
            className="bg-white shadow-[0_1px_3px_rgba(20,30,60,0.08),0_12px_32px_rgba(20,30,60,0.10)] relative shrink-0"
            style={{ width: pageW * scale, height: pageH * scale }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <div className="relative" style={{ width: pageW, height: pageH }}>
                {templateDataUrl ? (
                  <iframe
                    src={`${templateDataUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                    title="Template PDF"
                  />
                ) : (
                  <div className="absolute inset-x-0 top-3 text-center text-[11px] text-[#9aa5bb]">
                    No template PDF uploaded. Upload one in the General tab to see the fields on it.
                  </div>
                )}

                {visible.map((el) => {
                  const colors = kindPalette(el.kind);
                  return (
                    <div
                      key={el.id}
                      className="absolute overflow-hidden flex"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                        fontSize: el.fontSize,
                        lineHeight: (el.leading / el.fontSize).toFixed(2),
                        fontFamily: el.fontFamily,
                        fontWeight: el.bold ? 700 : 400,
                        fontStyle: el.italic ? 'italic' : 'normal',
                        textDecoration: el.underline ? 'underline' : 'none',
                        justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
                        alignItems: el.valign === 'top' ? 'flex-start' : el.valign === 'bottom' ? 'flex-end' : 'center',
                        textAlign: el.align,
                        color: '#111827',
                        background: showBoxes ? el.bg : 'transparent',
                        border: showBoxes ? `1px ${el.border === 'dashed' ? 'dashed' : 'solid'} ${colors.border}` : 'none',
                        padding: `${el.pad.t}px ${el.pad.r}px ${el.pad.b}px ${el.pad.l}px`,
                        whiteSpace: el.wrap ? 'pre-wrap' : 'nowrap',
                      }}
                    >
                      {el.imageUrl ? (
                        <img src={el.imageUrl} alt={el.label} className="w-full h-full object-contain" />
                      ) : el.typeLabel === 'QR Code' ? (
                        <QrGlyph />
                      ) : el.typeLabel === 'Table' ? (
                        <table className="w-full border-collapse" style={{ fontSize: el.fontSize }}>
                          <thead>
                            <tr>
                              {['No.', 'Description', 'HS Code', 'Qty'].map((h) => (
                                <th key={h} className="border border-[#9ca3af] px-1 text-left font-semibold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2].map((n) => (
                              <tr key={n}>
                                <td className="border border-[#9ca3af] px-1">{n}</td>
                                <td className="border border-[#9ca3af] px-1">Sample goods {n}</td>
                                <td className="border border-[#9ca3af] px-1">0901.11</td>
                                <td className="border border-[#9ca3af] px-1">{n * 50}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        sampleValueFor(el)
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}