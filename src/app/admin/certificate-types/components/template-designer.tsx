'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-icons/fi';
import General from './General';
import ApplicableFields from './Applicable-Fields';
import RequiredDocuments from './Required-documents';
import MemberingFormat from './MemberingFormat';
import FeeCharges from './FeeCharges';

interface TemplateDesignerProps {
  mode?: 'create' | 'edit';
  certificateType?: any;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Align = 'left' | 'center' | 'right';
type VAlign = 'top' | 'middle' | 'bottom';
type BorderStyle = 'none' | 'solid' | 'dashed';
type FieldKind = 'nrs-locked' | 'application' | 'goods' | 'system' | 'component';

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

let idCounter = 1;
const uid = (prefix: string) => `${prefix}_${idCounter++}`;

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
/* Paper geometry (PDF points, A4 landscape)                           */
/* ------------------------------------------------------------------ */

const PAPER_W = 842;
const PAPER_H = 595;
const GRID_STEP = 8;

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
}

const APPLICATION_FIELDS_VISIBLE = 14;
const TOTAL_ENABLED_FIELDS = 26;

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
/* Seed layout                                                         */
/* ------------------------------------------------------------------ */

function makeField(
  partial: Pick<FieldElement, 'text' | 'label' | 'kind' | 'typeLabel' | 'source' | 'x' | 'y' | 'w' | 'h'> &
    Partial<FieldElement>
): FieldElement {
  const p = kindPalette(partial.kind);
  return {
    id: uid('el'),
    fontSize: partial.h && partial.h <= 18 ? 8.5 : 9.5,
    leading: 9.5,
    fontFamily: 'Helvetica',
    bold: false,
    italic: false,
    underline: false,
    align: 'center',
    valign: 'middle',
    color: '#000000',
    bg: '#ffffff',
    wrap: true,
    maxLines: 4,
    required: false,
    readOnly: partial.kind === 'system',
    repeated: false,
    border: p.dashed ? 'dashed' : 'solid',
    borderColor: p.dashed ? PURPLE_BORDER : p.border,
    pad: { t: 2, r: 3, b: 2, l: 3 },
    enabled: true,
    ...partial,
  };
}

function makeSeed(): FieldElement[] {
  const seed: FieldElement[] = [
    // top bar
    makeField({ text: 'CO/00001234', label: 'Certificate Number', kind: 'system', typeLabel: 'Text', source: 'System', x: 686, y: 22, w: 132, h: 22 }),

    // section 1 — exporter
    makeField({ text: 'SHIPPER_NAME', label: "Shipper's Name", kind: 'nrs-locked', typeLabel: 'Text', source: 'NRS', x: 28, y: 52, w: 379, h: 17, align: 'left' }),
    makeField({ text: 'SHIPPER_ADDRESS', label: "Shipper's Address", kind: 'nrs-locked', typeLabel: 'Text', source: 'NRS', x: 28, y: 71, w: 379, h: 17, align: 'left' }),

    // section 2 — consignee
    makeField({ text: 'CONSIGNEE', label: 'Consignee', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 28, y: 100, w: 379, h: 17, align: 'left' }),
    makeField({ text: 'CONSIGNEE_ADDRESS', label: 'Consignee Address', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 28, y: 119, w: 379, h: 17, align: 'left' }),

    // section 3 — transport
    makeField({ text: 'MODE_OF_TRANSPORT', label: 'Mode of Transport', kind: 'application', typeLabel: 'Dropdown', source: 'Manual Entry', x: 28, y: 154, w: 248, h: 16 }),
    makeField({ text: 'PORT_OF_LOADING', label: 'Port of Loading', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 66, y: 176, w: 210, h: 15, align: 'left', fontSize: 8 }),
    makeField({ text: 'PORT_OF_DISCHARGE', label: 'Port of Discharge', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 66, y: 196, w: 210, h: 15, align: 'left', fontSize: 8 }),

    // section 4 — for official use
    makeField({ text: 'APPROVAL_NUMBER', label: 'Approval Number', kind: 'system', typeLabel: 'Text', source: 'System', x: 316, y: 194, w: 208, h: 22 }),

    // section 5 — country of origin
    makeField({ text: 'COUNTRY_OF_ORIGIN', label: 'Country of Origin', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 584, y: 194, w: 210, h: 22 }),

    // section 6 — marks & numbers
    makeField({ text: 'MARKS_NO', label: 'Marks / Numbers', kind: 'application', typeLabel: 'Multi-line text', source: 'Manual Entry', x: 30, y: 250, w: 126, h: 58 }),

    // section 7 — packages
    makeField({ text: 'TOTAL_PACKAGES', label: 'Total Packages', kind: 'application', typeLabel: 'Number', source: 'Manual Entry', x: 180, y: 246, w: 156, h: 17 }),
    makeField({ text: 'PACKAGE_TYPE', label: 'Package Type', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 180, y: 267, w: 156, h: 17 }),

    // section 8 — description of goods (selected in mockup)
    makeField({ text: 'DESCRIPTION_OF_GOODS', label: 'Description of Goods', kind: 'goods', typeLabel: 'Multi-line text', source: 'Goods Item', x: 360, y: 246, w: 256, h: 62 }),

    // section 9 — HS code
    makeField({ text: 'HS_CODE', label: 'HS Code', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 640, y: 250, w: 172, h: 18 }),

    // section 10 — origin criterion
    makeField({ text: 'CRITERIA_ETLS', label: 'Criteria (ETLS)', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 30, y: 350, w: 126, h: 18 }),

    // section 11 — gross weight
    makeField({ text: 'GROSS_WEIGHT', label: 'Gross Weight or Quantity', kind: 'application', typeLabel: 'Number', source: 'Manual Entry', x: 180, y: 350, w: 156, h: 18 }),

    // section 12 — invoice
    makeField({ text: 'INVOICE_NUMBER', label: 'Invoice Number', kind: 'application', typeLabel: 'Text', source: 'Manual Entry', x: 360, y: 344, w: 256, h: 16 }),
    makeField({ text: 'INVOICE_DATE', label: 'Invoice Date', kind: 'application', typeLabel: 'Date', source: 'Manual Entry', x: 360, y: 364, w: 256, h: 16 }),

    // section 13 — FOB value
    makeField({ text: 'FOB_VALUE', label: 'FOB Value (USD for CoO)', kind: 'application', typeLabel: 'Number', source: 'Manual Entry', x: 640, y: 350, w: 172, h: 18 }),

    // section 14 — certification
    makeField({ text: 'ISSUE_DATE', label: 'Issue Date', kind: 'system', typeLabel: 'Date', source: 'System', x: 30, y: 496, w: 170, h: 20 }),
    makeField({ text: 'SIGNATURE', label: 'Signature', kind: 'system', typeLabel: 'Image', source: 'System', x: 214, y: 496, w: 172, h: 20 }),

    // section 15 — issuing office
    makeField({ text: 'ISSUING_OFFICE', label: 'Issuing Office', kind: 'system', typeLabel: 'Text', source: 'System', x: 420, y: 432, w: 172, h: 20 }),
    makeField({ text: 'SEAL_STAMP', label: 'Seal / Stamp', kind: 'system', typeLabel: 'Image', source: 'System', x: 420, y: 496, w: 172, h: 20 }),

    // verification
    makeField({ text: 'QR_CODE', label: 'QR Code', kind: 'system', typeLabel: 'QR Code', source: 'System', x: 626, y: 428, w: 62, h: 62 }),
    makeField({ text: 'VERIFICATION_CODE', label: 'Verification Code', kind: 'system', typeLabel: 'Text', source: 'System', x: 606, y: 500, w: 210, h: 18 }),
  ];

  return seed;
}

interface SectionBox {
  n: number | null;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const SECTIONS: SectionBox[] = [
  { n: 1, label: 'Exporter (Name, address, country)', x: 24, y: 48, w: 389, h: 40 },
  { n: 2, label: 'Consignee (Name, address, country)', x: 24, y: 96, w: 389, h: 40 },
  { n: 3, label: 'Means of Transport and Route (as far as known)', x: 24, y: 150, w: 256, h: 76 },
  { n: 4, label: 'For Official Use', x: 292, y: 150, w: 256, h: 76 },
  { n: 5, label: 'Country of Origin', x: 560, y: 150, w: 258, h: 76 },
  { n: 6, label: 'Marks & Numbers', x: 24, y: 234, w: 140, h: 90 },
  { n: 7, label: 'Number and Kind of Packages', x: 174, y: 234, w: 170, h: 90 },
  { n: 8, label: 'Description of Goods', x: 354, y: 234, w: 270, h: 90 },
  { n: 9, label: 'HS Code', x: 634, y: 234, w: 184, h: 90 },
  { n: 10, label: 'Origin Criterion', x: 24, y: 336, w: 140, h: 56 },
  { n: 11, label: 'Gross Weight or Other Quantity', x: 174, y: 336, w: 170, h: 56 },
  { n: 12, label: 'Number and Date of Invoices', x: 354, y: 336, w: 270, h: 56 },
  { n: 13, label: 'FOB Value (USD for CoO)', x: 634, y: 336, w: 184, h: 56 },
  { n: 14, label: 'Certification', x: 24, y: 410, w: 390, h: 130 },
  { n: 15, label: 'Issuing Office', x: 424, y: 410, w: 190, h: 130 },
  { n: null, label: 'Verification', x: 624, y: 410, w: 194, h: 130 },
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

export function TemplateDesigner({ mode = 'create', certificateType }: TemplateDesignerProps) {
  const [activeTab, setActiveTab] = useState('template-designer');
  const [elements, setElements] = useState<FieldElement[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('template-designer-elements-v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return makeSeed();
        }
      }
    }
    return makeSeed();
  });
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
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [templatePageSize, setTemplatePageSize] = useState<{ width: number; height: number } | null>(null);
  const [showElements, setShowElements] = useState(false);

  const [past, setPast] = useState<FieldElement[][]>([]);
  const [future, setFuture] = useState<FieldElement[][]>([]);

  // Load enabled fields from localStorage and listen for changes
  useEffect(() => {
    const loadEnabledFields = () => {
      const saved = localStorage.getItem('applicable-fields-enabled');
      if (saved) {
        try {
          setEnabledFields(JSON.parse(saved));
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
        } catch (e) {
          console.error('Failed to parse enabled fields from storage event:', e);
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

  // Load template URL from localStorage and listen for changes
  useEffect(() => {
    const loadTemplateUrl = () => {
      const saved = localStorage.getItem('certificate-template-url');
      if (saved) {
        setTemplateUrl(saved);
      }
    };

    // Initial load
    loadTemplateUrl();

    // Listen for custom event (when template is uploaded in General tab)
    const handleTemplateEvent = (e: CustomEvent) => {
      setTemplateUrl(e.detail.templateUrl);
      setTemplatePageSize(e.detail.pageSize);
    };

    window.addEventListener('template-url-uploaded', handleTemplateEvent as EventListener);

    return () => {
      window.removeEventListener('template-url-uploaded', handleTemplateEvent as EventListener);
    };
  }, []);

  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  const commit = useCallback((updater: (prev: FieldElement[]) => FieldElement[]) => {
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
      const el: FieldElement = {
        id: uid('el'),
        text: item.label.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        label: item.label,
        typeLabel: item.typeLabel,
        source: item.source,
        kind: item.kind,
        enabled: true,
        x: x ?? 60,
        y: y ?? 60,
        w: item.w,
        h: item.h,
        fontSize: item.h <= 18 ? 8.5 : 9.5,
        leading: 9.5,
        fontFamily: 'Helvetica',
        bold: false,
        italic: false,
        underline: false,
        align: 'center',
        valign: 'middle',
        color: '#000000',
        bg: '#ffffff',
        wrap: true,
        maxLines: 4,
        required: false,
        readOnly: item.kind === 'system',
        repeated: false,
        border: p.dashed ? 'dashed' : 'solid',
        borderColor: p.dashed ? PURPLE_BORDER : p.border,
        pad: { t: 2, r: 3, b: 2, l: 3 },
      };
      commit((prev) => [...prev, el]);
      setSelectedId(el.id);
      setShowElements(true);
    },
    [commit]
  );

  const onElMouseDown = (e: React.MouseEvent, el: FieldElement) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    setPast((p) => [...p.slice(-49), elements]);
    setFuture([]);
    dragRef.current = { id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
  };

  const onDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    const item = FULL_PALETTE_GROUPS.flatMap((g) => g.items).find((i) => i.type === type);
    if (!item || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    let x = Math.round((e.clientX - rect.left) / zoom);
    let y = Math.round((e.clientY - rect.top) / zoom);
    if (snapOn) {
      x = Math.round(x / GRID_STEP) * GRID_STEP;
      y = Math.round(y / GRID_STEP) * GRID_STEP;
    }
    addComponent(item, x, y);
    setShowElements(true);
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== gridRef.current) return;
    setSelectedId(null);
    setShowElements(true);
  };

  useEffect(() => {
    function onMove(e: MouseEvent) {
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
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [zoom, snapOn]);

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

  useEffect(() => {
    localStorage.setItem('template-designer-elements-v2', JSON.stringify(elements));
  }, [elements]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const handleFitWidth = () => {
    const container = canvasScrollRef.current;
    if (!container) return;
    const available = container.clientWidth - 48;
    const next = Math.min(2, Math.max(0.4, available / PAPER_W));
    setZoom(Math.round(next * 100) / 100);
  };

  const handleReset = () => {
    commit(() => makeSeed());
    setSelectedId(null);
  };

  // Mapping from template-designer field IDs to Applicable-Fields field IDs (uppercase underscore format from API)
  const FIELD_ID_MAP: Record<string, string> = {
    'consigneeAddress': 'CONSIGNEE_ADDRESS',
    'shipperName': 'SHIPPER_NAME',
    'shipperAddress': 'SHIPPER_ADDRESS',
    'tin': 'TIN',
    'importerEmail': 'IMPORTER_EMAIL',
    'modeOfTransport': 'MODE_OF_TRANSPORT',
    'consignee': 'CONSIGNEE',
    'carrier': 'CARRIER',
    'destination': 'DESTINATION',
    'countryOfManufacturing': 'COUNTRY_OF_MANUFACTURING',
    'fobValue': 'FOB_VALUE',
    'totalItems': 'TOTAL_ITEMS',
    'date': 'DATE',
    'hsCode': 'HS_CODE',
    'marksNo': 'MARKS_NO',
    'ecowasNumber': 'ECOWAS_NUMBER',
    'criteriaEtls': 'CRITERIA_ETLS',
    'unitOfMeasurement': 'UNIT_OF_MEASUREMENT',
    'numberKindPackages': 'NUMBER_KIND_PACKAGES',
    'descriptionOfGoods': 'DESCRIPTION_OF_GOODS',
    'grossWeight': 'GROSS_WEIGHT',
    'nomenclature': 'NOMENCLATURE',
    'invoiceNumber': 'INVOICE_NUMBER',
    'approvalNumber': 'APPROVAL_NUMBER',
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FULL_PALETTE_GROUPS.map((g) => {
      let filteredItems = g.items;
      
      // Filter Application Fields based on enabled fields from localStorage
      if (g.label === 'Application Fields') {
        filteredItems = g.items.filter((i) => {
          const fieldId = FIELD_ID_MAP[i.type] || i.type;
          const isEnabled = enabledFields[fieldId] !== false;
          return isEnabled;
        });
      }
      
      // Apply search filter
      if (q) {
        filteredItems = filteredItems.filter((i) => i.label.toLowerCase().includes(q));
      }
      
      return { ...g, items: filteredItems };
    }).filter((g) => g.items.length > 0);
  }, [search, enabledFields]);

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
            <select className="px-3 py-1.5 border border-[#d1d5db] rounded text-[13px] min-w-[200px]">
              <option>Certificate of origin (NACCIMA-CO)</option>
              <option>Certificate of inspection</option>
              <option>Phytosanitary certificate</option>
            </select>
          </div>
          <button className="px-3 py-1.5 border border-[#d1d5db] rounded text-[13px] font-medium hover:bg-[#f4f5f7] flex items-center gap-1">
            Preview PDF
          </button>
          <button
            className={`px-3 py-1.5 rounded text-[13px] font-medium flex items-center gap-1 transition-colors ${
              saved ? 'bg-[#1f8a44] text-white' : 'bg-[#1a4a8a] text-white hover:bg-[#153c70]'
            }`}
            onClick={handleSave}
          >
            <FiSave size={14} /> {saved ? 'Saved' : 'Save changes'}
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
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="flex-1 overflow-auto bg-[#f9fafb]">
          <General onTabChange={setActiveTab} />
        </div>
      )}
      {activeTab === 'applicable-fields' && (
        <div className="flex-1 overflow-auto bg-[#f9fafb] p-6">
          <ApplicableFields onTabChange={setActiveTab} />
        </div>
      )}
      {activeTab === 'required-documents' && (
        <div className="flex-1 overflow-auto bg-[#f9fafb] p-6">
          <RequiredDocuments />
        </div>
      )}
      {activeTab === 'numbering-format' && (
        <div className="flex-1 overflow-auto bg-[#f9fafb] p-6">
          <MemberingFormat />
        </div>
      )}
      {activeTab === 'Fee' && (
        <div className="flex-1 overflow-auto bg-[#f9fafb]">
          <FeeCharges />
        </div>
      )}

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
          <div className="flex-1 flex overflow-hidden">
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
                      edit properties.
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
                  width: (templatePageSize?.width || PAPER_W) * zoom, 
                  height: (templatePageSize?.height || PAPER_H) * zoom 
                }}
              >
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                  <div
                    ref={gridRef}
                    className="relative"
                    style={{
                      width: templatePageSize?.width || PAPER_W,
                      height: templatePageSize?.height || PAPER_H,
                      backgroundImage: gridOn
                        ? 'linear-gradient(to right, #eef1f6 1px, transparent 1px), linear-gradient(to bottom, #eef1f6 1px, transparent 1px)'
                        : undefined,
                      backgroundSize: `${GRID_STEP}px ${GRID_STEP}px`,
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropOnCanvas}
                    onMouseDown={onCanvasMouseDown}
                  >
                    {/* PDF Template Background */}
                    {templateUrl && (
                      <iframe
                        src={templateUrl}
                        className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                        title="Template Preview"
                      />
                    )}

                    {/* Static chrome - commented out to show only uploaded PDF */}
                    {/* <div className="absolute left-6 top-5 text-[15px] font-bold tracking-[0.25em] text-[#1a2236]">
                      ORIGINAL
                    </div>
                    <div className="absolute right-6 top-6 text-right">
                      <div className="text-[9px] font-semibold text-[#6a7a9a] mb-1">Certificate No.</div>
                    </div>

                    <div className="absolute text-center" style={{ left: 429, top: 48, width: 389 }}>
                      <p className="text-[13px] font-bold text-[#1a2236] tracking-wide">CERTIFICATE OF ORIGIN</p>
                      <p className="text-[9.5px] text-[#3a4560] mt-1.5">issued by</p>
                      <p className="text-[10.5px] font-semibold text-[#1a2236] mt-1 leading-snug">
                        NIGERIAN ASSOCIATION OF CHAMBERS OF
                        <br />
                        COMMERCE, INDUSTRY, MINES &amp; AGRICULTURE
                        <br />
                        (NACCIMA)
                      </p>
                      <p className="text-[9.5px] text-[#3a4560] mt-1.5 tracking-widest">NIGERIA</p>
                    </div>

                    <div className="absolute left-6 border-t-2 border-[#1a2236]" style={{ top: 40, width: PAPER_W - 48 }} />

                    <p className="absolute text-center text-[9px] text-[#9aa5bb]" style={{ left: 24, bottom: 6, width: PAPER_W - 48 }}>
                      Name and Signature / Stamp
                    </p> */}

                    {/* Section outlines - commented out to show only uploaded PDF */}
                    {/* <div className="absolute inset-0 pointer-events-none">
                      {SECTIONS.map((s) => (
                        <div key={s.label}>
                          <div
                            className="absolute text-[9px] font-semibold text-[#4a5a7a]"
                            style={{ left: s.x, top: s.y - 13 }}
                          >
                            {s.n != null ? `${s.n}. ${s.label}` : s.label}
                          </div>
                          <div
                            className="absolute border border-[#dbe0ea] rounded-[2px]"
                            style={{ left: s.x, top: s.y, width: s.w, height: s.h }}
                          />
                        </div>
                      ))}
                      <p
                        className="absolute text-[9px] leading-relaxed text-[#3a4560]"
                        style={{ left: 66, top: 176 - 13 }}
                      >
                        FROM:
                      </p>
                      <p
                        className="absolute text-[9px] leading-relaxed text-[#3a4560]"
                        style={{ left: 66, top: 196 - 13 }}
                      >
                        TO:
                      </p>
                      <p
                        className="absolute text-[9px] leading-relaxed text-[#3a4560]"
                        style={{ left: 30, top: 434, width: 358 }}
                      >
                        It is hereby certified, on the basis of control carried out, that the declaration by the
                        exporter is correct.
                      </p>
                    </div> */}

                    {/* Draggable field elements */}
                    {showElements && elements.map((el) => {
                      const isSelected = el.id === selectedId;
                      return (
                        <div
                          key={el.id}
                          className={`absolute cursor-move overflow-hidden flex font-semibold select-none ${
                            isSelected ? 'ring-2 ring-[#1a4a8a] ring-offset-1' : ''
                          }`}
                          onMouseDown={(e) => onElMouseDown(e, el)}
                          style={{
                            left: el.x,
                            top: el.y,
                            width: el.w,
                            height: el.h,
                            fontSize: el.fontSize,
                            lineHeight: (el.leading / el.fontSize).toFixed(2),
                            fontFamily: el.fontFamily,
                            fontWeight: el.bold ? 700 : 600,
                            fontStyle: el.italic ? 'italic' : 'normal',
                            textDecoration: el.underline ? 'underline' : 'none',
                            justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
                            alignItems: el.valign === 'top' ? 'flex-start' : el.valign === 'bottom' ? 'flex-end' : 'center',
                            color: kindPalette(el.kind).text,
                            background: kindPalette(el.kind).bg,
                            border: `1.4px ${el.border === 'none' ? 'solid' : el.border} ${
                              el.border === 'none' ? kindPalette(el.kind).border : el.borderColor
                            }`,
                            borderRadius: 4,
                            padding: `${el.pad.t}px ${el.pad.r}px ${el.pad.b}px ${el.pad.l}px`,
                            whiteSpace: el.wrap ? 'pre-wrap' : 'nowrap',
                            opacity: el.enabled ? 1 : 0.4,
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
                Paper: {PAPER_W} x {PAPER_H} pt
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
              <button className="px-3.5 py-1.5 border border-[#d1d5db] rounded text-[12.5px] font-medium text-[#3a4560] hover:bg-[#f4f5f7] transition-colors">
                Preview PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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

function SwitchField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[13px] font-medium text-[#1a2236]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[#1a4a8a]' : 'bg-[#d1d5db]'}`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function PaletteRow({ item, onAdd }: { item: PaletteItem; onAdd: () => void }) {
  const Icon = item.icon;
  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2 border border-[#e5e8f0] rounded-lg cursor-grab hover:border-[#1a4a8a] hover:bg-[#f5f8ff] transition-all group"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', item.type)}
      onClick={onAdd}
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
        <div className="flex items-center justify-between gap-2">
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
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#6a7a9a]">
          <span>
            Type: <span className="font-medium text-[#3a4560]">{el.typeLabel}</span>
          </span>
          <span>
            Source: <span className="font-medium text-[#3a4560]">{el.source}</span>
          </span>
        </div>
      </div>

      {el.typeLabel === 'Image' && el.label === 'Badge / Logo' && (
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
      <div className="grid grid-cols-2 gap-2 mb-4">
        <NumberField label="Width" value={el.w} onChange={(v) => onChange({ w: v })} />
        <NumberField label="Height" value={el.h} onChange={(v) => onChange({ h: v })} />
      </div>

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