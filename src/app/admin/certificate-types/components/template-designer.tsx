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

const TemplateDesigner = forwardRef<TemplateDesignerRef, TemplateDesignerProps>(({ mode = 'create', certificateType }, ref) => {
  console.log('TemplateDesigner props - mode:', mode, 'certificateType:', certificateType);
  const [activeTab, setActiveTab] = useState('template-designer');

  // Refs for child components
  const generalRef = useRef<GeneralRef>(null);
  const applicableFieldsRef = useRef<ApplicableFieldsRef>(null);
  const requiredDocumentsRef = useRef<RequiredDocumentsRef>(null);
  const memberingFormatRef = useRef<MemberingFormatRef>(null);
  const feeChargesRef = useRef<FeeChargesRef>(null);
  const [elements, setElements] = useState<FieldElement[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('template-designer-elements-v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
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
  const [templateDataUrl, setTemplateDataUrl] = useState<string | null>(null);
  const [templatePageSize, setTemplatePageSize] = useState<{ width: number; height: number } | null>(null);
  const [apiFields, setApiFields] = useState<ApiField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [certificateTypeCode, setCertificateTypeCode] = useState<string>('');

  const [past, setPast] = useState<FieldElement[][]>([]);
  const [future, setFuture] = useState<FieldElement[][]>([]);

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
        text: item.type,
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

  // Expose data via ref
  useImperativeHandle(ref, () => ({
    getData: () => ({
      templateConfig: {
        elements,
        pageSize: templatePageSize,
      },
    }),
  }), [elements, templatePageSize]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
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

    // Build templateConfig as JSON string with proper structure
    // Convert template designer elements to fields format
    const fields: any = {};
    elements.forEach((element) => {
      if (element.kind !== 'component') {
        fields[element.id] = {
          x: element.x,
          y: element.y,
          width: element.w,
          height: element.h || 20,
          fontSize: element.fontSize || 10,
          font: element.fontFamily || 'HELVETICA',
          align: element.align || 'LEFT',
          wrap: element.wrap || false,
        };
      }
    });

    const templateConfigObj = {
      page: {
        index: generalData?.pageIndex || 0,
        width: generalData?.pageSize?.width || 608.16,
        height: generalData?.pageSize?.height || 1008.48,
      },
      fields,
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

  const handleFitWidth = () => {
    const container = canvasScrollRef.current;
    if (!container) return;
    const available = container.clientWidth - 48;
    const next = Math.min(2, Math.max(0.4, available / PAPER_W));
    setZoom(Math.round(next * 100) / 100);
  };

  const handleReset = () => {
    commit(() => []);
    setSelectedId(null);
  };

  // Mapping from template-designer field IDs to Applicable-Fields field IDs (uppercase underscore format from API)
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

      <div className="flex-1 overflow-auto bg-[#f9fafb]">
        <div className={activeTab === 'general' ? '' : 'hidden'}>
          <General ref={generalRef} onTabChange={setActiveTab} />
        </div>
        <div className={activeTab === 'applicable-fields' ? '' : 'hidden'}>
          <ApplicableFields ref={applicableFieldsRef} onTabChange={setActiveTab} />
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
                  height: (templatePageSize?.height || PAPER_H) * zoom,
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
                    {/* PDF template background, if one was uploaded in the General tab */}
                    {templateDataUrl && (
                      <iframe
                        src={`${templateDataUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                        title="Template Preview"
                      />
                    )}

                    {/* Draggable field elements */}
                    {elements.map((el) => {
                      const isSelected = el.id === selectedId;
                      const kindColors = kindPalette(el.kind);
                      return (
                        <div
                          key={el.id}
                          className={`absolute cursor-move overflow-hidden flex select-none ${
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
                            color: el.color,
                            background: el.bg,
                            border: `1.4px ${el.border === 'none' ? 'solid' : el.border} ${
                              el.border === 'none' ? kindColors.border : el.borderColor
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
                Paper: {templatePageSize?.width ?? PAPER_W} x {templatePageSize?.height ?? PAPER_H} pt
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