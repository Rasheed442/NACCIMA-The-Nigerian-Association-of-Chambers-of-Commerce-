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
// gesture completes. `draggingRef` suppresses the click handler for the
// duration of (and immediately after) a drag gesture so one drag can't add
// two fields.
function PaletteRow({
  item,
  onAdd,
  status,
}: {
  item: PaletteItem;
  onAdd: () => void;
  status?: 'placed' | 'in-table';
}) {
  const Icon = item.icon;
  const draggingRef = useRef(false);

  const handleDragStart = (e: React.DragEvent) => {
    draggingRef.current = true;
    e.dataTransfer.setData('text/plain', item.type);
  };

  const handleDragEnd = () => {
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
      {status && (
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold border ${
            status === 'placed'
              ? 'bg-[#e8f0fe] border-[#bcd2f7] text-[#1a4a8a]'
              : 'bg-[#fff4e5] border-[#f3cf9a] text-[#9a5b00]'
          }`}
          title={
            status === 'placed'
              ? 'Already on the template'
              : 'Already a column in the Goods Table (adding it again would print it twice)'
          }
        >
          {status === 'placed' ? 'Placed' : 'In table'}
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

// One column of the Goods Table. `code` is the goods-line data key the backend
// fills; width is a percentage of the table's width so resizing the table
// scales every column.
interface GoodsColumn {
  key: string;
  code: string;
  label: string;
  enabled: boolean;
  widthPct: number;
  align: Align;
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
  // Goods Table only: the columns printed for each goods line.
  goodsColumns?: GoodsColumn[];
  // Goods Table only: print a header row (column titles). Default on.
  showHeader?: boolean;
  goodsAlignVersion?: number;
  autoHeight?: boolean;
}

// Ids must be globally unique (see earlier fix): selection/highlighting
// matches purely by id, so a counter that restarts on every page load could
// collide with ids already saved on a loaded template.
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

// Fallback only. As soon as the template PDF is loaded, PdfBackdrop reports
// the PDF page's REAL size and that replaces these values, so the canvas
// coordinate space is always the PDF's own coordinate space.
const PAPER_W = 608.16;
const PAPER_H = 1008.48;
const GRID_STEP = 8;

/* ------------------------------------------------------------------ */
/* Sizing                                                              */
/* ------------------------------------------------------------------ */

const MIN_W = 16;
const MIN_H = 12;
const DEFAULT_MAX_W = 140;
const CANVAS_PADDING = 32;
const CASCADE_STEP = 24;
const CASCADE_MAX = 10;

// Readable default for a ~1000 pt wide page (was 8.5 pt, tuned for 608 pt).
const DEFAULT_FONT_SIZE = 12;
// A single line of text needs about 1.2x its font size of height. With a box
// that tight, centred and bottom-anchored text land in nearly the same place,
// so the designer and the renderer can't disagree much vertically.
const LINE_RATIO = 1.2;
// A box taller than this many font sizes is treated as multi-line and left alone.
const SINGLE_LINE_MAX_RATIO = 2.2;
const NON_SINGLE_LINE_TYPES = ['QR Code', 'Image', 'Checkbox', 'Table', 'Multi-line Text', 'Barcode'];

function isSingleLineType(typeLabel: string, kind: FieldKind) {
  return kind !== 'goods' && kind !== 'component' && !NON_SINGLE_LINE_TYPES.includes(typeLabel);
}

function isSingleLineBox(el: { typeLabel: string; kind: FieldKind; h: number; fontSize: number }) {
  return isSingleLineType(el.typeLabel, el.kind) && el.h <= el.fontSize * SINGLE_LINE_MAX_RATIO;
}

// How repeated (per goods line) fields should be stacked. Saved in
// templateConfig.goodsLayout for the renderer; the designer itself never
// draws the repeated rows.
interface GoodsLayout {
  rowGap: number; // empty space between goods lines (pt)
  autoRowHeight: boolean; // each line grows to fit its tallest wrapped value
  tableBottomY: number; // lowest Y the rows may reach (designer coordinates); 0 = no limit
}
const DEFAULT_GOODS_LAYOUT: GoodsLayout = { rowGap: 6, autoRowHeight: true, tableBottomY: 0 };

// Printed table look (generated PDF + Preview). Change here to restyle.
const GOODS_BORDER_COLOR = '#000000';
const GOODS_BORDER_WIDTH = 0.5; // pt
const GOODS_PAGE_BOTTOM_MARGIN = 24

// Default Goods Table columns, in the order requested. Widths are percentages
// and must add up to what the printed form has; untick columns the form
// doesn't print (e.g. HS Code / Nomenclature on forms without those columns).
const DEFAULT_GOODS_COLUMNS: GoodsColumn[] = [
  { key: 'itemNo', code: 'ITEM_NO', label: 'Item No.', enabled: true, widthPct: 7, align: 'center' },
  { key: 'marksNo', code: 'MARKS_NO', label: 'Marks & Numbers', enabled: true, widthPct: 12, align: 'left' },
  { key: 'hsCode', code: 'HS_CODE', label: 'HS Code', enabled: true, widthPct: 12, align: 'left' },
  { key: 'description', code: 'DESCRIPTION', label: 'Description', enabled: true, widthPct: 24, align: 'left' },
  { key: 'nomenclature', code: 'NOMENCLATURE', label: 'Nomenclature', enabled: true, widthPct: 17, align: 'left' },
  { key: 'grossWeight', code: 'GROSS_WEIGHT', label: 'Gross Weight', enabled: true, widthPct: 9, align: 'left' },
  { key: 'netWeight', code: 'NET_WEIGHT', label: 'Net Weight', enabled: true, widthPct: 9, align: 'left' },
  { key: 'fobValue', code: 'VALUE', label: 'FOB Value', enabled: true, widthPct: 10, align: 'left' },
];

function getGoodsColumns(el: { goodsColumns?: GoodsColumn[] }): GoodsColumn[] {
  return el.goodsColumns && el.goodsColumns.length > 0 ? el.goodsColumns : DEFAULT_GOODS_COLUMNS;
}

// Header row height: two lines, so a long title like "Marks & Numbers" can wrap in a narrow column.
function goodsHeaderHeight(el: { leading: number; fontSize: number }): number {
  return Math.ceil((el.leading || el.fontSize * LINE_RATIO) * 2);
}

// Which standalone single fields are the same data as a Goods Table column.
// (Total FOB Value is deliberately NOT here: it is a certificate total, not a per-line value.)
const GOODS_COLUMN_FOR_FIELD: Record<string, string> = {
  itemNo: 'itemNo', ITEM_NO: 'itemNo',
  marksNo: 'marksNo', MARKS_NO: 'marksNo',
  hsCode: 'hsCode', HS_CODE: 'hsCode',
  descriptionOfGoods: 'description', DESCRIPTION_OF_GOODS: 'description',
  description: 'description', DESCRIPTION: 'description',
  nomenclature: 'nomenclature', NOMENCLATURE: 'nomenclature',
  grossWeight: 'grossWeight', GROSS_WEIGHT: 'grossWeight',
  netWeight: 'netWeight', NET_WEIGHT: 'netWeight',
  value: 'fobValue', VALUE: 'fobValue',
};

function sampleGoodsCell(key: string, n: number): string {
  switch (key) {
    case 'itemNo':
      return String(n);
    case 'marksNo':
      return `ABC00${n}`;
    case 'hsCode':
      return '0101210000';
    case 'description':
      return n === 2
        ? 'Atlantic and Pacific bluefin tunas (Thunnus thynnus, Thunnus orientalis)'
        : `Sample goods ${n}`;
    case 'nomenclature':
      return `Nomenclature ${n}`;
    case 'grossWeight':
      return '200.00';
    case 'netWeight':
      return '180.00';
    case 'fobValue':
      return '230.00';
    default:
      return '';
  }
}

// Builds templateConfig.goods for the renderer from the Goods Table element.
//
// !! ASSUMED SCHEMA - confirm against a template config the backend already
// !! accepts (one that has `goods.columns`, `goods.startY`, `goods.minY`):
//   - columns[CODE] = { x, width, fontSize, font, align, wrap }, with x being
//     the column's left edge in PDF points from the page's left edge.
//   - startY / minY are written in PDF-native coordinates (origin bottom-left,
//     y grows upward): startY = top of the first row, minY = lowest y the
//     rows may reach. The same numbers in the designer's top-left system are
//     included as designerTopY / designerBottomY in case the renderer expects
//     those instead. If the real schema differs, only this function changes.
//   - background / borders describe the table's own white panel and ruled
//     lines; the renderer must draw the panel BEFORE any table text.
// The output offset (page-box calibration) is applied here just like for fields.
function buildGoodsConfig(el: FieldElement, layout: GoodsLayout, offset: { x: number; y: number }, pageH: number) {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const cols = getGoodsColumns(el).filter((c) => c.enabled);
  const totalPct = cols.reduce((s, c) => s + c.widthPct, 0) || 1;

  let cursor = el.x + offset.x;
  const columns: Record<string, unknown> = {};
  const dividerXs: number[] = [];
  cols.forEach((c) => {
    if (cursor > el.x + offset.x + 0.01) dividerXs.push(r2(cursor)); // line between columns
    const width = (el.w * c.widthPct) / totalPct;
    columns[c.code] = {
      x: r2(cursor),
      width: r2(width),
      fontSize: el.fontSize || 10,
      font: (el.fontFamily || 'HELVETICA').toUpperCase(),
      align: c.align.toUpperCase(),
      wrap: true,
    };
    cursor += width;
  });

  const topY = el.y + offset.y;
  const bottomY = el.y + el.h + offset.y;
  const showHeader = el.showHeader !== false;
  const headerH = showHeader ? goodsHeaderHeight(el) : 0;
    const autoHeight = el.autoHeight !== false;
  // Lowest point the table may reach. Auto-expanding tables are limited only by
  // "Stop growing at Y" (or the page-bottom margin), not by the box you drew.
  const growBottomDesignerY =
    layout.tableBottomY > 0 ? layout.tableBottomY + offset.y : pageH - GOODS_PAGE_BOTTOM_MARGIN;
  const headers: Record<string, string> = {};
  cols.forEach((c) => {
    headers[c.code] = c.label;
  });
  return {
    columns,
    // Header row (column titles), drawn at the top of the table box when showHeader is true.
    showHeader,
    headers,
    headerHeight: headerH,
    headerAlign: 'LEFT',
    headerBold: false,
    headerStartY: r2(pageH - topY),
    // Data rows begin below the header.
    startY: r2(pageH - (topY + headerH)),
    minY: autoHeight ? r2(pageH - growBottomDesignerY) : r2(pageH - bottomY),
    designerTopY: r2(topY),
    designerRowsTopY: r2(topY + headerH),
    designerBottomY: autoHeight ? r2(growBottomDesignerY) : r2(bottomY),
     autoHeight,
       minHeight: r2(el.h),
    overflow: 'CONTINUE_ON_NEXT_PAGE',
    leading: el.leading,
    bold: el.bold,
    italic: el.italic,
    maxLines: el.maxLines,
    rowGap: layout.rowGap,
    autoRowHeight: layout.autoRowHeight,
    // The table gets its own white panel (drawn first, so it covers any lines
    // of the form printed underneath) and ruled borders like the designer.
    background: {
      enabled: true,
      color: '#FFFFFF',
      x: r2(el.x + offset.x),
      topY: r2(pageH - topY), // anchored at the top; extends downward
      y: r2(pageH - bottomY), // bottom edge at the minimum height
      width: r2(el.w),
      height: r2(el.h), // minimum height
      autoHeight,
    },
    borders: {
      outer: true,
      columnDividers: true,
      headerDivider: showHeader,
      rowDividers: false,
      color: GOODS_BORDER_COLOR,
      width: GOODS_BORDER_WIDTH,
      autoHeight,
      columnDividerXs: dividerXs,
      headerDividerY: r2(pageH - (topY + headerH)),
    },
  };
}

function defaultWidthFor(item: { kind: FieldKind; w: number }) {
  if (item.kind === 'goods' || item.w <= 100) return item.w;
  return Math.min(item.w, DEFAULT_MAX_W);
}

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
  repeatable?: boolean;
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
    repeatable: field.repeatable,
  };
}

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
      { type: 'ecowasNumber', label: 'ECOWAS Number', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'criteriaEtls', label: 'Criteria (ETLS)', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'unitOfMeasurement', label: 'Unit of Measurement', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'numberKindPackages', label: 'Number and Kind of Packages', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
      { type: 'invoiceNumber', label: 'Invoice Number', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Manual Entry', w: 140, h: 18 },
    ],
  },
  {
    label: 'Goods Fields',
    items: [
      { type: 'goodsTable', label: 'Goods Table', icon: FiGrid, kind: 'goods', typeLabel: 'Table', source: 'Goods Item', w: 400, h: 120 },
      // The individual goods-line fields stay in the palette too (they are the Goods Table's columns).
      { type: 'itemNo', label: 'Item No.', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Goods Item', w: 60, h: 18, repeatable: true },
      { type: 'marksNo', label: 'Marks / No.', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Goods Item', w: 140, h: 18, repeatable: true },
      { type: 'hsCode', label: 'HS Code', icon: FiHash, kind: 'application', typeLabel: 'Text', source: 'Goods Item', w: 140, h: 18, repeatable: true },
      { type: 'descriptionOfGoods', label: 'Description of Goods', icon: FiFileText, kind: 'application', typeLabel: 'Text', source: 'Goods Item', w: 220, h: 18, repeatable: true },
      { type: 'nomenclature', label: 'Nomenclature of Goods', icon: FiFileText, kind: 'application', typeLabel: 'Text', source: 'Goods Item', w: 180, h: 18, repeatable: true },
      { type: 'grossWeight', label: 'Gross Weight or Quantity', icon: FiHash, kind: 'application', typeLabel: 'Number', source: 'Goods Item', w: 140, h: 18, repeatable: true },
      { type: 'netWeight', label: 'Net Weight', icon: FiHash, kind: 'application', typeLabel: 'Number', source: 'Goods Item', w: 140, h: 18, repeatable: true },
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

const FIELD_ID_MAP: Record<string, string> = {
  consigneeAddress: 'CONSIGNEE_ADDRESS',
  shipperName: 'SHIPPER_NAME',
  shipperAddress: 'SHIPPER_ADDRESS',
  shipper: 'SHIPPER_NAME',
  tin: 'TIN',
  importerEmail: 'IMPORTER_EMAIL',
  modeOfTransport: 'MODE_OF_TRANSPORT',
  transport: 'MODE_OF_TRANSPORT',
  consignee: 'CONSIGNEE',
  carrier: 'CARRIER',
  destination: 'DESTINATION',
  countryOfManufacturing: 'COUNTRY_OF_MANUFACTURING',
  fobValue: 'FOB_VALUE',
  totalValueFob: 'TOTAL_VALUE_FOB',
  totalItems: 'TOTAL_ITEMS',
  date: 'DATE',
  hsCode: 'HS_CODE',
  marksNo: 'MARKS_NO',
  ecowasNumber: 'ECOWAS_NUMBER',
  criteria: 'CRITERIA',
  criteriaEtls: 'CRITERIA_ETLS',
  unit: 'UNIT',
  unitOfMeasurement: 'UNIT_OF_MEASUREMENT',
  quantity: 'QUANTITY',
  numberKindPackages: 'NUMBER_KIND_PACKAGES',
  description: 'DESCRIPTION',
  descriptionOfGoods: 'DESCRIPTION_OF_GOODS',
  grossWeight: 'GROSS_WEIGHT',
  nomenclature: 'NOMENCLATURE',
  value: 'VALUE',
  invoiceNumber: 'INVOICE_NUMBER',
  approvalNumber: 'APPROVAL_NUMBER',
  certificateNumber: 'CERTIFICATE_NUMBER',
  verificationCode: 'VERIFICATION_CODE',
  qrCode: 'QR_CODE',
  itemNo: 'ITEM_NO',
  netWeight: 'NET_WEIGHT',
};

function backendFieldCode(elementText: string): string {
  return FIELD_ID_MAP[elementText] || elementText;
}

// Elements that are actually written to templateConfig.fields.
// Disabled fields are hidden in Preview, so they must not be rendered on the
// generated certificate either; components (checkboxes) and the goods table
// have no entry in `fields`.
function isRenderedField(el: FieldElement) {
  return el.enabled && el.kind !== 'component' && el.kind !== 'goods';
}

// `fields` is keyed by backend code, so two canvas elements with the
// same code (e.g. "destination" placed twice) collapse into one entry and
// one of them silently disappears from the generated certificate.
function findDuplicateCodes(elements: FieldElement[]): string[] {
  const counts = new Map<string, number>();
  elements.filter(isRenderedField).forEach((el) => {
    const code = backendFieldCode(el.text);
    counts.set(code, (counts.get(code) || 0) + 1);
  });
  return Array.from(counts.entries())
    .filter(([, n]) => n > 1)
    .map(([code]) => code);
}

// Height one goods line needs if its tallest repeated field filled all of its
// allowed lines (wrapped fields: maxLines x leading; others: one line).
function repeatedRowHeight(elements: FieldElement[]): number {
  const repeated = elements.filter((e) => isRenderedField(e) && e.repeated);
  if (repeated.length === 0) return 0;
  return Math.ceil(
    Math.max(...repeated.map((e) => (e.wrap ? Math.max(1, e.maxLines) : 1) * (e.leading || e.fontSize * LINE_RATIO)))
  );
}

// Standalone fields that are ALSO enabled columns of the Goods Table, i.e. data
// that would be printed twice.
function findGoodsConflicts(elements: FieldElement[]): FieldElement[] {
  const table = elements.find((e) => e.kind === 'goods' && e.enabled);
  if (!table) return [];
  const keys = new Set(getGoodsColumns(table).filter((c) => c.enabled).map((c) => c.key));
  return elements.filter((e) => {
    if (!isRenderedField(e)) return false;
    const key = GOODS_COLUMN_FOR_FIELD[e.text];
    return !!key && keys.has(key);
  });
}

// What to show next to a palette row so used fields stay visible but are flagged.
function paletteStatus(item: PaletteItem, elements: FieldElement[]): 'placed' | 'in-table' | undefined {
  if (item.kind === 'goods') return elements.some((e) => e.kind === 'goods') ? 'placed' : undefined;
  if (item.kind === 'component') return undefined;
  const code = backendFieldCode(item.type);
  if (elements.some((e) => isRenderedField(e) && backendFieldCode(e.text) === code)) return 'placed';
  const table = elements.find((e) => e.kind === 'goods' && e.enabled);
  const key = GOODS_COLUMN_FOR_FIELD[item.type];
  if (table && key && getGoodsColumns(table).some((c) => c.key === key && c.enabled)) return 'in-table';
  return undefined;
}

/* ------------------------------------------------------------------ */
/* PDF backdrop                                                        */
/* ------------------------------------------------------------------ */

// The media server doesn't send CORS headers, so the browser won't let us read
// template PDF bytes from it directly (an <iframe> can display it, but pdf.js
// needs the bytes). Route those URLs through a same-origin Next.js route:
//   /api/pdf-proxy?url=...  (app/api/pdf-proxy/route.ts fetches the exact URL server-side)
// Once the media server allows this origin via CORS, this can be removed.
const MEDIA_HOST = 'mediaserver.advancedtechnologypark.com';
function toSameOriginPdfUrl(src: string): { url: string; proxied: boolean } {
  try {
    const u = new URL(src);
    if (u.host === MEDIA_HOST) {
      return { url: `/api/pdf-proxy?url=${encodeURIComponent(src)}`, proxied: true };
    }
  } catch {
    /* relative or data: URL - leave as is */
  }
  return { url: src, proxied: false };
}

// Resolution multiplier for the rasterised page (CSS size stays pageW x pageH).
const BACKDROP_QUALITY = 2;

// ROOT-CAUSE FIX. The designer used to show the template in an <iframe>
// stretched to whatever pageW x pageH the canvas happened to have. The
// browser's PDF viewer lays the page out by its own rules (fit-width, gaps,
// margins), so the picture you positioned fields on did not correspond to
// the PDF's real point coordinates, while the server draws text at those
// real coordinates. Every field therefore landed a little off, by a
// different amount depending on where it was.
//
// This renders the chosen PDF page to a canvas (pdf.js) and reports the
// page's real size in points, so the canvas coordinate space IS the PDF's
// coordinate space. If pdfjs-dist isn't available or fails, it falls back
// to the old iframe so the designer still works.
function PdfBackdrop({
  src,
  pageIndex = 0,
  onMeasured,
}: {
  src: string;
  pageIndex?: number;
  onMeasured?: (size: { width: number; height: number; view?: number[]; rotate?: number }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const onMeasuredRef = useRef(onMeasured);
  onMeasuredRef.current = onMeasured;

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;
    let loadingTask: { destroy: () => void } | null = null;
    setUseFallback(false);

    (async () => {
      try {
        // @ts-ignore - optional dependency: `npm i pdfjs-dist`
        const pdfjs: any = await import('pdfjs-dist');
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          // pdf.js v4+ ships an .mjs worker. On v3 use `pdf.worker.min.js`.
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        }

        // Load the bytes ourselves (through apiFetch, so auth headers/credentials
        // match the rest of the app) instead of letting pdf.js fetch the URL.
        let res: Response;
        const target = toSameOriginPdfUrl(src);
        try {
          res =
            src.startsWith('data:') || target.proxied
              ? await fetch(target.url)
              : await apiFetch(src);
        } catch (fetchErr) {
          throw new Error(
            `Could not fetch template PDF from ${src}. Check the Network tab: this is usually CORS ` +
            `(the file route must allow this frontend origin), auth, or a wrong URL. (${String(fetchErr)})`
          );
        }
        if (!res.ok) throw new Error(`Template PDF request to ${src} returned HTTP ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (cancelled) return;

        const task = pdfjs.getDocument({ data: bytes });
        loadingTask = task;
        const doc = await task.promise;
        if (cancelled) return;

        const index = Math.min(Math.max(pageIndex, 0), doc.numPages - 1);
        const page = await doc.getPage(index + 1);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        onMeasuredRef.current?.({
          width: Math.round(base.width * 100) / 100,
          height: Math.round(base.height * 100) / 100,
          view: Array.isArray(page.view) ? page.view.map((n: number) => Math.round(n * 100) / 100) : undefined,
          rotate: typeof page.rotate === 'number' ? page.rotate : 0,
        });

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const viewport = page.getViewport({ scale: BACKDROP_QUALITY });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const task2 = page.render({ canvas, canvasContext: ctx, viewport });
        renderTask = task2;
        await task2.promise;
      } catch (err: any) {
        if (cancelled || err?.name === 'RenderingCancelledException') return;
        console.warn('[TemplateDesigner] pdf.js backdrop unavailable, falling back to iframe:', err);
        setUseFallback(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        /* ignore */
      }
      try {
        loadingTask?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [src, pageIndex]);

  if (useFallback) {
    return (
      <iframe
        src={`${src}#toolbar=0&navpanes=0&scrollbar=0`}
        className="absolute inset-0 w-full h-full border-0 pointer-events-none"
        title="Template Preview"
      />
    );
  }

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

const TemplateDesigner = forwardRef<TemplateDesignerRef, TemplateDesignerProps>(({ mode = 'create', certificateType }, ref) => {
  const [activeTab, setActiveTab] = useState(mode === 'create' ? 'general' : 'template-designer');

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
  const [templatePageIndex, setTemplatePageIndex] = useState(0);
  const [apiFields, setApiFields] = useState<ApiField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [certificateTypeCode, setCertificateTypeCode] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingCertificate, setIsSavingCertificate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [bulkFontSize, setBulkFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  // Stopgap calibration: a fixed shift (PDF points) added to every field's x/y
  // ONLY in the saved templateConfig.fields (what the renderer reads). The
  // designer's own positions (elements) are untouched.
  const [outputOffset, setOutputOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [goodsLayout, setGoodsLayout] = useState<GoodsLayout>(DEFAULT_GOODS_LAYOUT);
  // Short-lived message shown when something is refused or flagged (e.g. a field that would print twice).
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(t);
  }, [notice]);

  const [past, setPast] = useState<FieldElement[][]>([]);
  const [future, setFuture] = useState<FieldElement[][]>([]);

  // Effective page size (PDF points) used by the canvas, resizing, AND saved
  // as templateConfig.page. This is the single source of truth.
  const pageW = templatePageSize?.width || PAPER_W;
  const pageH = templatePageSize?.height || PAPER_H;

  // Called by PdfBackdrop with the PDF page's real size in points.
  const [pdfBox, setPdfBox] = useState<{ view: number[]; rotate: number } | null>(null);
  const handlePdfMeasured = useCallback(
    (size: { width: number; height: number; view?: number[]; rotate?: number }) => {
      const next = { width: size.width, height: size.height };
      setTemplatePageSize((prev) =>
        prev && Math.abs(prev.width - next.width) < 0.01 && Math.abs(prev.height - next.height) < 0.01 ? prev : next
      );
      if (size.view) {
        setPdfBox({ view: size.view, rotate: size.rotate ?? 0 });
        // eslint-disable-next-line no-console
        console.info('[TemplateDesigner] PDF page box (x0,y0,x1,y1):', size.view, 'rotate:', size.rotate ?? 0);
      }
    },
    []
  );

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

    loadEnabledFields();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'applicable-fields-enabled' && e.newValue) {
        try {
          setEnabledFields(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse enabled fields from storage event:', err);
        }
      }
    };

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

  // Template uploaded in General tab. The size in the event is only a first
  // guess; PdfBackdrop replaces it with the measured page size.
  useEffect(() => {
    const handleTemplateEvent = (e: CustomEvent) => {
      setTemplateDataUrl(e.detail.dataUrl);
      if (e.detail.pageSize) setTemplatePageSize(e.detail.pageSize);
      setTemplatePageIndex(Number.isFinite(e.detail.pageIndex) ? e.detail.pageIndex : 0);
    };

    window.addEventListener('template-data-uploaded', handleTemplateEvent as EventListener);

    return () => {
      window.removeEventListener('template-data-uploaded', handleTemplateEvent as EventListener);
    };
  }, []);

  // When editing, preload the already-uploaded PDF.
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
        setTemplatePageSize((prev) =>
          prev && prev.width === page.width && prev.height === page.height
            ? prev
            : { width: page.width, height: page.height }
        );
      }
      setTemplatePageIndex(Number.isFinite(page?.index) ? page.index : 0);
    } catch {
      // A template preview can still be shown when no saved page metadata exists.
    }
  }, [certificateType?.id, certificateType?.templateUrl, certificateType?.templateConfig]);

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
         const seenIds = new Set<string>();
      const deduped = loaded.map((el) => {
        let next = el;
        // One-time migration: weight/value columns used to default to right alignment.
        if (el.kind === 'goods' && Array.isArray(el.goodsColumns) && el.goodsAlignVersion !== 2) {
          next = {
            ...el,
            goodsAlignVersion: 2,
            goodsColumns: el.goodsColumns.map((c) =>
              ['grossWeight', 'netWeight', 'fobValue'].includes(c.key) && c.align === 'right'
                ? { ...c, align: 'left' as Align }
                : c
            ),
          };
        }
        const isDuplicate = !next.id || seenIds.has(next.id);
        if (isDuplicate) {
          return { ...next, id: uid('el') };
        }
        seenIds.add(next.id);
        return next;
      });
      setElements(deduped);
      setSelectedId(null);
      setOutputOffset({
        x: Number(config?.calibration?.x) || 0,
        y: Number(config?.calibration?.y) || 0,
      });
      const savedGoods = config?.goodsLayout;
      setGoodsLayout({
        rowGap: Number.isFinite(Number(savedGoods?.rowGap)) && savedGoods?.rowGap !== undefined
          ? Number(savedGoods.rowGap)
          : DEFAULT_GOODS_LAYOUT.rowGap,
        autoRowHeight: savedGoods?.autoRowHeight !== false,
        // Saved value includes the output offset; remove it so the designer shows the raw number.
        tableBottomY: savedGoods?.tableBottomY
          ? Math.round((Number(savedGoods.tableBottomY) - (Number(config?.calibration?.y) || 0)) * 100) / 100
          : 0,
      });
    } catch {
      setElements([]);
      setSelectedId(null);
    }
  }, [certificateType]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.dispatchEvent(new CustomEvent('template-unsaved-changes', { detail: hasUnsavedChanges }));

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    reloadElementsFromCertificateType();
  }, [reloadElementsFromCertificateType]);

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
      } finally {
        setLoadingFields(false);
      }
    };

    fetchFields();
  }, [certificateType]);

  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
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
      // Don't add something that would print twice; tell the user why instead.
      if (item.kind === 'goods') {
        if (elements.some((e) => e.kind === 'goods')) {
          setNotice('A Goods Table is already on the template. Only one can be used; move or edit the existing one.');
          return;
        }
      } else if (item.kind !== 'component') {
        const table = elements.find((e) => e.kind === 'goods' && e.enabled);
        const colKey = GOODS_COLUMN_FOR_FIELD[item.type];
        if (table && colKey && getGoodsColumns(table).some((c) => c.key === colKey && c.enabled)) {
          setNotice(
            `"${item.label}" is already a column in the Goods Table, so adding it again would print it twice. ` +
              'To place it on its own, untick that column in the Goods Table settings first.'
          );
          return;
        }
        const code = backendFieldCode(item.type);
        if (elements.some((e) => isRenderedField(e) && backendFieldCode(e.text) === code)) {
          setNotice(`"${item.label}" is already on the template. Move or delete the existing one instead of adding it again.`);
          return;
        }
      }

      const p = kindPalette(item.kind);
      const isGoods = item.kind === 'goods';
      // The goods table spans most of the page width and a good part of its height.
      const w = isGoods ? Math.round(pageW * 0.85) : defaultWidthFor(item);
      const singleLine = isSingleLineType(item.typeLabel, item.kind);
      const newFontSize = isGoods ? 10 : DEFAULT_FONT_SIZE;
      const newLeading = Math.round(newFontSize * LINE_RATIO * 10) / 10;
          const newHeight = isGoods
        ? Math.round(pageH * 0.12)
        : singleLine
        ? Math.ceil(newFontSize * LINE_RATIO)
        : item.h;

      // Click-added fields are centred in the visible part of the canvas and
      // cascaded diagonally so they never stack on top of each other.
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

        const cascadeIndex = clickAddIndexRef.current % CASCADE_MAX;
        clickAddIndexRef.current += 1;
        posX = Math.round(baseX + cascadeIndex * CASCADE_STEP);
        posY = Math.round(baseY + cascadeIndex * CASCADE_STEP);

        posX = Math.min(Math.max(0, posX), Math.max(0, pageW - w));
        posY = Math.min(Math.max(0, posY), Math.max(0, pageH - item.h));
        if (snapOn) {
          posX = Math.round(posX / GRID_STEP) * GRID_STEP;
          posY = Math.round(posY / GRID_STEP) * GRID_STEP;
        }
      }

      if (isGoods) {
        posX = Math.min(Math.max(0, posX), Math.max(0, pageW - w));
        posY = Math.min(Math.max(0, posY), Math.max(0, pageH - newHeight));
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
        w,
        h: newHeight,
        fontSize: newFontSize,
        leading: newLeading,
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
        repeated: !!item.repeatable,
        border: p.dashed ? 'dashed' : 'solid',
        borderColor: p.border,
        // No vertical padding on single-line boxes: the renderer works from the
        // box edges, so padding would only make the designer disagree with it.
        pad: singleLine ? { t: 0, r: 3, b: 0, l: 3 } : { t: 2, r: 3, b: 2, l: 3 },
        goodsColumns: isGoods ? DEFAULT_GOODS_COLUMNS.map((c) => ({ ...c })) : undefined,
        goodsAlignVersion: isGoods ? 2 : undefined,
      };
      commit((prev) => [...prev, el]);
      setSelectedId(el.id);
    },
    [commit, zoom, snapOn, pageW, pageH, elements]
  );

  const onElMouseDown = (e: React.MouseEvent, el: FieldElement) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    setPast((p) => [...p.slice(-49), elements]);
    setFuture([]);
    // Drag updates x/y directly (bypassing commit), so flag unsaved here.
    setHasUnsavedChanges(true);
    dragRef.current = { id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
  };

  const onResizeMouseDown = (e: React.MouseEvent, el: FieldElement, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    setPast((p) => [...p.slice(-49), elements]);
    setFuture([]);
    setHasUnsavedChanges(true);
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
    // The backdrop canvas/iframe is a child of the grid, so accept clicks on
    // it as "empty canvas" too (previously only the grid div itself counted).
    const target = e.target as HTMLElement;
    if (target !== gridRef.current && target.tagName !== 'CANVAS' && target.tagName !== 'IFRAME') return;
    setSelectedId(null);
  };

  useEffect(() => {
    const snap = (v: number) => (snapOn ? Math.round(v / GRID_STEP) * GRID_STEP : Math.round(v));

    function onMove(e: MouseEvent) {
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

        if (rz.handle.includes('w')) left = snap(rz.origX + dx);
        if (rz.handle.includes('e')) right = snap(origRight + dx);
        if (rz.handle.includes('n')) top = snap(rz.origY + dy);
        if (rz.handle.includes('s')) bottom = snap(origBottom + dy);

        if (rz.handle.includes('w')) left = Math.min(left, origRight - MIN_W);
        if (rz.handle.includes('e')) right = Math.max(right, rz.origX + MIN_W);
        if (rz.handle.includes('n')) top = Math.min(top, origBottom - MIN_H);
        if (rz.handle.includes('s')) bottom = Math.max(bottom, rz.origY + MIN_H);

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

  useImperativeHandle(ref, () => ({
    getData: () => ({
      templateConfig: {
        elements,
        pageSize: templatePageSize,
      },
    }),
  }), [elements, templatePageSize]);

  const handleSave = async () => {
    if (mode === 'create' || activeTab === 'general') {
      const validationErrors = generalRef.current?.validate() ?? {};
      if (Object.keys(validationErrors).length > 0) {
        setActiveTab('general');
        setSaveError('Complete the required General fields before saving.');
        return;
      }
    }

    // Refuse to save a layout where one field code is placed twice —
    // the server keys fields by code, so only one placement would survive.
    const duplicateCodes = findDuplicateCodes(elements);
    if (duplicateCodes.length > 0) {
      setActiveTab('template-designer');
      setSaveError(
        `These fields are placed more than once and only one placement can be rendered: ${duplicateCodes.join(', ')}. ` +
        'Delete or disable the extra copies, then save again.'
      );
      return;
    }

    // Fields that are also Goods Table columns would be printed twice.
    const goodsDupes = findGoodsConflicts(elements);
    if (goodsDupes.length > 0) {
      setActiveTab('template-designer');
      setSaveError(
        `These fields are also columns in the Goods Table and would print twice: ${goodsDupes
          .map((e) => e.label)
          .join(', ')}. Delete the field, or untick the column in the Goods Table settings, then save again.`
      );
      return;
    }

    setIsSavingCertificate(true);
    setSaveError(null);
    try {
      const formData = getFormData();

      if (mode === 'create' || !certificateType?.id) {
        const feeChargesData = feeChargesRef.current?.getData();
        const feeStructureJson = feeChargesData?.feeStructure 
          ? JSON.stringify(feeChargesData.feeStructure)
          : JSON.stringify({
              type: 'PERCENTAGE',
              memberRate: 0.11,
              nonMemberRate: 0.125,
              vatRate: 0.075
            });

        console.log('Fee structure JSON:', feeStructureJson);

        const payload = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          active: formData.active !== undefined ? formData.active : true,
          applicableFields: formData.applicableFields,
          requiredDocuments: formData.requiredDocuments,
          feeStructure: feeStructureJson,
          templateUrl: formData.templateUrl,
          certNumberPrefix: formData.certNumberPrefix,
          templateConfig: formData.templateConfig,
        };

        console.log('Create payload:', payload);

        const response = await apiFetch(`${getBaseUrl()}/api/v1/admin/certificate-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'Failed to create certificate type.');
        }

        const generalData = generalRef.current?.getData();
        if (generalData?.templateFile && result.data?.id) {
          try {
            const baseUrl = getBaseUrl();
            const formDataTemplate = new FormData();
            formDataTemplate.append('file', generalData.templateFile);

            console.log('Re-uploading template to new certificate type ID:', result.data.id);
            const uploadResponse = await apiFetch(`${baseUrl}/api/v1/admin/certificate-types/${result.data.id}/template`, {
              method: 'POST',
              body: formDataTemplate,
            });

            const uploadResult = await uploadResponse.json();
            console.log('Template re-upload result:', uploadResult);
            
            if (uploadResponse.ok && uploadResult.data?.templateUrl) {
              console.log('Template successfully re-uploaded to new certificate type');
            } else {
              console.error('Template re-upload failed:', uploadResult);
            }
          } catch (uploadError) {
            console.error('Failed to re-upload template after creation:', uploadError);
          }
        }

        setSaved(true);
        setHasUnsavedChanges(false);
        setShowUnsavedWarning(false);
        setTimeout(() => setSaved(false), 1200);
        
        setTimeout(() => {
          window.location.href = '/admin/certificate-types';
        }, 1500);
      } else {
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
        setShowUnsavedWarning(false);
        setTimeout(() => setSaved(false), 1200);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save certificate type.');
    } finally {
      setIsSavingCertificate(false);
    }
  };

  const handleSubmitCertificateType = () => {
    console.log('Certificate type submitted successfully');
  };

  // Collect all form data from child components
  const getFormData = () => {
    const generalData = generalRef.current?.getData();
    const applicableFieldsData = applicableFieldsRef.current?.getData();
    const requiredDocumentsData = requiredDocumentsRef.current?.getData();
    const memberingFormatData = memberingFormatRef.current?.getData();

    console.log('getFormData - generalData:', generalData);
    console.log('getFormData - applicableFieldsData:', applicableFieldsData);
    console.log('getFormData - requiredDocumentsData:', requiredDocumentsData);

    let requiredDocumentsString = "[\"COMMERCIAL_INVOICE\",\"PACKING_LIST\",\"BILL_OF_LADING\"]";
    if (requiredDocumentsData?.requiredDocuments) {
      if (typeof requiredDocumentsData.requiredDocuments === 'object' && !Array.isArray(requiredDocumentsData.requiredDocuments)) {
        const allDocs = Object.values(requiredDocumentsData.requiredDocuments).flat();
        requiredDocumentsString = JSON.stringify(allDocs);
      } else if (Array.isArray(requiredDocumentsData.requiredDocuments)) {
        requiredDocumentsString = JSON.stringify(requiredDocumentsData.requiredDocuments);
      }
    }

    // templateConfig.fields is keyed by backend field CODE (not canvas id).
    //  - disabled elements are not written (Preview already hides them);
    //  - valign / leading / bold / italic / maxLines are included so the
    //    renderer can match what the designer shows (the designer centres text
    //    vertically inside the box; without valign the renderer can only guess).
    //    If your backend rejects unknown keys, remove those lines.
    const fields: any = {};
    // The first enabled Goods Table is written as templateConfig.goods below.
    const goodsElement = elements.find((e) => e.kind === 'goods' && e.enabled) ?? null;
    let hasUnmappedGoodsTable = false;

    elements.forEach((element) => {
      if (element.kind === 'goods' && element.enabled) {
        // Extra Goods Tables can't be mapped (the backend has one goods region).
        if (element !== goodsElement) hasUnmappedGoodsTable = true;
        return;
      }
      if (!isRenderedField(element)) return;

      const code = backendFieldCode(element.text);
      fields[code] = {
        x: Math.round((element.x + outputOffset.x) * 100) / 100,
        y: Math.round((element.y + outputOffset.y) * 100) / 100,
        width: element.w,
        height: element.h || 20,
        fontSize: element.fontSize || 10,
        font: (element.fontFamily || 'HELVETICA').toUpperCase(),
        align: (element.align || 'left').toUpperCase(),
        wrap: element.wrap || false,
        valign: (element.valign || 'top').toUpperCase(),
        leading: element.leading,
        bold: element.bold,
        italic: element.italic,
        maxLines: element.maxLines,
        repeated: element.repeated,
      };
    });

    if (hasUnmappedGoodsTable) {
      // eslint-disable-next-line no-console
      console.warn(
        '[TemplateDesigner] More than one Goods Table is on the canvas. Only the first is saved ' +
        'as templateConfig.goods; delete the extra one(s).'
      );
    }

    // `page` is exactly the coordinate space the fields were authored in
    // (the PDF's real page size, measured by PdfBackdrop).
    const templateConfigObj: any = {
      page: {
        index: generalData?.pageIndex ?? templatePageIndex ?? 0,
        width: pageW,
        height: pageH,
      },
      fields,
      elements,
      // Goods Table -> per-column placement + row region + white panel/borders for the renderer (see buildGoodsConfig).
      goods: goodsElement ? buildGoodsConfig(goodsElement, goodsLayout, outputOffset, pageH) : undefined,
      // Saved so reopening the template keeps the calibration (designer positions stay un-shifted).
      calibration: { x: outputOffset.x, y: outputOffset.y },
      // Layout intent for goods lines. Written under its own key so it can't
      // collide with the backend's own `goods` schema. The renderer must read it.
      goodsLayout: {
        rowGap: goodsLayout.rowGap,
        autoRowHeight: goodsLayout.autoRowHeight,
        tableBottomY: goodsLayout.tableBottomY ? goodsLayout.tableBottomY + outputOffset.y : null,
        repeatedFields: elements.filter((e) => isRenderedField(e) && e.repeated).map((e) => backendFieldCode(e.text)),
        rowCapacity: repeatedRowHeight(elements),
      },
    };

    const templateConfigString = JSON.stringify(templateConfigObj);

    console.log('=== TEMPLATE CONFIGURATION DEBUG ===');
    console.log('Template Config Object:', templateConfigObj);
    console.log('Template Config JSON:', templateConfigString);
    console.log('Field Keys:', Object.keys(fields));
    console.log('Total Fields:', Object.keys(fields).length);
    console.log('Page Dimensions:', { width: pageW, height: pageH, index: templateConfigObj.page.index });
    console.log('=== END TEMPLATE CONFIGURATION DEBUG ===');

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

  // Apply one text size to every single-line text field and shrink its box to
  // one line (about 1.2x the font size), keeping the box centred where the
  // user put it. Tall multi-line boxes (e.g. descriptions) are left alone.
  const handleApplySizeAndFit = () => {
    const fs = bulkFontSize;
    if (!(fs > 0)) return;
    commit((prev) =>
      prev.map((el) => {
        if (!isSingleLineType(el.typeLabel, el.kind)) return el;
        if (el.h > Math.max(el.fontSize, fs) * SINGLE_LINE_MAX_RATIO) return el;
        const newH = Math.ceil(fs * LINE_RATIO);
        return {
          ...el,
          fontSize: fs,
          leading: Math.round(fs * LINE_RATIO * 10) / 10,
          h: newH,
          y: Math.max(0, Math.round(el.y + (el.h - newH) / 2)),
          pad: { ...el.pad, t: 0, b: 0 },
        };
      })
    );
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (apiFields.length > 0) {
      const grouped = apiFields.reduce((acc, field) => {
        if (!field.applicable) return acc;

        const category = field.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(field);
        return acc;
      }, {} as Record<string, ApiField[]>);

      const groups = Object.entries(grouped).map(([category, fields]) => ({
        label: category,
        items: fields.map(apiFieldToPaletteItem),
      }));

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

    return FULL_PALETTE_GROUPS.map((g) => {
      let filteredItems = g.items;

      if (g.label === 'Application Fields' || g.label === 'Goods Fields') {
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
            <FiSave size={14} /> {isSavingCertificate ? 'Saving…' : saved ? 'Saved' : (mode === 'create' ? 'Create Document' : 'Save changes')}
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
              if (mode === 'create') {
                setActiveTab(tab.id);
              } else if (activeTab === 'template-designer' && hasUnsavedChanges) {
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

      {saveError && (
        <div
          role="alert"
          className="shrink-0 flex items-start justify-between gap-3 border-b border-red-200 bg-red-50 px-5 py-3 text-[13px] text-red-700"
        >
          <span>{saveError}</span>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="shrink-0 text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {showUnsavedWarning && (
        <>
          <div className="fixed inset-0 bg-[#0000009e] z-40" />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-[#3a7bd5] rounded shadow-lg p-6 z-50 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="text-[#3a7bd5] text-xl">⚠️</span>
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
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#3a7bd5] rounded hover:bg-[#2a5a8a]"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => {
                      setShowUnsavedWarning(false);
                      setHasUnsavedChanges(false);
                      setPendingTab(null);
                      reloadElementsFromCertificateType();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex-1 overflow-auto bg-[#f9fafb]">
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
                          <PaletteRow key={item.type} item={item} onAdd={() => addComponent(item)} status={paletteStatus(item, elements)} />
                        ))}
                      </div>
                      {isAppGroup && group.items.length > APPLICATION_FIELDS_VISIBLE && (
                        <button
                          className="mt-2 text-[12px] font-semibold text-[#1a4a8a] hover:underline"
                          onClick={() => setShowAllApplicationFields((v) => !v)}
                        >
                          {showAllApplicationFields ? 'Show less' : `View all (${group.items.length} enabled fields)`}
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
                    {/* PDF template backdrop: rendered 1:1 in the PDF's own point space */}
                    {templateDataUrl && (
                      <PdfBackdrop
                        src={templateDataUrl}
                        pageIndex={templatePageIndex}
                        onMeasured={handlePdfMeasured}
                      />
                    )}

                    {/* Draggable + resizable field elements */}
                    {elements.map((el) => {
                      const isSelected = el.id === selectedId;
                      const kindColors = kindPalette(el.kind);
                      const handleSize = 9 / zoom;
                      return (
                        <div
                          key={el.id}
                          className="absolute select-none"
                          style={{
                            left: el.x,
                            top: el.y,
                            width: el.w,
                            height: el.h,
                            opacity: el.enabled ? 1 : 0.4,
                            zIndex: isSelected ? 20 : el.kind === 'goods' ? 0 : 1,
                          }}
                        >
                          <div
                            className={`w-full h-full cursor-move overflow-hidden flex ${
                              isSelected ? 'ring-2 ring-[#1a4a8a] ring-offset-1' : ''
                            }`}
                            onMouseDown={(e) => onElMouseDown(e, el)}
                            style={{
                              fontSize: el.fontSize,
                              lineHeight: (el.leading / el.fontSize).toFixed(2),
                              fontFamily: el.fontFamily,
                              // Matches Preview / the generated PDF (was 600, which drew
                              // wider glyphs than the real output and skewed box sizing).
                              fontWeight: el.bold ? 700 : 400,
                              fontStyle: el.italic ? 'italic' : 'normal',
                              textDecoration: el.underline ? 'underline' : 'none',
                              justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
                              alignItems: el.valign === 'top' ? 'flex-start' : el.valign === 'bottom' ? 'flex-end' : 'center',
                              color: el.color,
                              // The goods table has its own white panel on the generated PDF.
                              background: el.kind === 'goods' ? '#ffffff' : el.bg,
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
                            ) : el.kind === 'goods' ? (
                              <GoodsTableGlyph el={el} />
                            ) : el.typeLabel === 'QR Code' ? (
                              <QrGlyph />
                            ) : (
                              el.text
                            )}
                          </div>

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
                  <>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-16 h-16 bg-[#f9fafb] rounded-full flex items-center justify-center mb-4">
                        <FiEye size={22} className="text-[#9ca3af]" />
                      </div>
                      <p className="text-[13px] text-[#6a7a9a] leading-relaxed max-w-[220px]">
                        Select a component on the template to edit its position, size, typography and colors here.
                      </p>
                    </div>
                    <GoodsLayoutPanel
                      layout={goodsLayout}
                      onChange={(patch) => {
                        setGoodsLayout((g) => ({ ...g, ...patch }));
                        setHasUnsavedChanges(true);
                      }}
                      repeatedCount={elements.filter((e) => isRenderedField(e) && e.repeated).length}
                      rowCapacity={repeatedRowHeight(elements)}
                    />
                  </>
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
              <span>Page {templatePageIndex + 1}</span>
              <span className="text-[#dde3ee]">|</span>
              <span>
                Paper: {pageW} x {pageH} pt
              </span>
              <span className="text-[#dde3ee]">|</span>
              <span>Units: PDF Points (pt)</span>
              <span className="text-[#dde3ee]">|</span>
              <span>Components: {elements.length}</span>
              {pdfBox && (pdfBox.view[0] !== 0 || pdfBox.view[1] !== 0 || pdfBox.rotate !== 0) && (
                <>
                  <span className="text-[#dde3ee]">|</span>
                  <span
                    className="text-[#b45309] font-medium"
                    title="This PDF's visible page area does not start at (0,0) or is rotated. If generated text is offset, the renderer may be using a different page box."
                  >
                    ⚠ Page box [{pdfBox.view.join(', ')}] · rotate {pdfBox.rotate}°
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#d1d5db] rounded text-[12.5px] font-medium text-[#3a4560] hover:bg-[#f4f5f7] transition-colors"
                onClick={handleReset}
              >
                <FiRefreshCw size={12} /> Reset
              </button>
              <div className="flex items-center gap-1.5 border border-[#d1d5db] rounded px-2.5 py-1">
                <span className="text-[12px] text-[#6a7a9a]">Text</span>
                <input
                  type="number"
                  min={1}
                  className="w-12 text-[12px] text-center outline-none"
                  value={bulkFontSize}
                  onChange={(e) => setBulkFontSize(Number(e.target.value))}
                />
                <span className="text-[12px] text-[#6a7a9a]">pt</span>
                <button
                  type="button"
                  className="ml-1 text-[12px] font-semibold text-[#1a4a8a] hover:underline"
                  onClick={handleApplySizeAndFit}
                  title="Set this text size on all single-line fields and fit their boxes to one line"
                >
                  Apply &amp; fit boxes
                </button>
              </div>
              <div
                className="flex items-center gap-1.5 border border-[#d1d5db] rounded px-2.5 py-1"
                title="Stopgap: shifts every field in the SAVED output by this many points. Use it when generated text is consistently offset from the designer. +X moves right, +Y moves down."
              >
                <span className="text-[12px] text-[#6a7a9a]">Output offset</span>
                <span className="text-[11px] text-[#9aa5bb]">X</span>
                <input
                  type="number"
                  className="w-12 text-[12px] text-center outline-none"
                  value={outputOffset.x}
                  onChange={(e) => {
                    setOutputOffset((o) => ({ ...o, x: Number(e.target.value) }));
                    setHasUnsavedChanges(true);
                  }}
                />
                <span className="text-[11px] text-[#9aa5bb]">Y</span>
                <input
                  type="number"
                  className="w-12 text-[12px] text-center outline-none"
                  value={outputOffset.y}
                  onChange={(e) => {
                    setOutputOffset((o) => ({ ...o, y: Number(e.target.value) }));
                    setHasUnsavedChanges(true);
                  }}
                />
                <span className="text-[12px] text-[#6a7a9a]">pt</span>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 border border-[#d1d5db] rounded text-[12.5px] font-medium text-[#3a4560] hover:bg-[#f4f5f7] transition-colors"
                onClick={() => setShowPreview(true)}
              >
                Preview PDF
              </button>
            </div>
          </div>

        </>
      )}

      {showPreview && (
        <PreviewModal
          elements={elements}
          pageW={pageW}
          pageH={pageH}
          pageIndex={templatePageIndex}
          templateDataUrl={templateDataUrl}
          rowGap={goodsLayout.rowGap}
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
      {isSingleLineType(el.typeLabel, el.kind) && (
        <button
          type="button"
          className="mb-2 text-[11.5px] font-semibold text-[#1a4a8a] hover:underline"
          onClick={() => {
            const newH = Math.ceil(el.fontSize * LINE_RATIO);
            onChange({
              h: newH,
              y: Math.max(0, Math.round(el.y + (el.h - newH) / 2)),
              pad: { ...el.pad, t: 0, b: 0 },
            });
          }}
        >
          Fit height to one line ({Math.ceil(el.fontSize * LINE_RATIO)} pt)
        </button>
      )}
      <p className="text-[10.5px] text-[#9aa5bb] mb-4">
        Tip: you can also drag the handles on the canvas to resize.
      </p>

      {el.kind === 'goods' && <GoodsColumnsEditor el={el} onChange={onChange} />}

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
        <NumberField
          label="Font Size"
          value={el.fontSize}
          onChange={(v) => {
            if (!(v > 0 && el.fontSize > 0 && el.leading > 0)) {
              onChange({ fontSize: v });
              return;
            }
            // Keep line spacing proportional to the font size...
            const patch: Partial<FieldElement> = {
              fontSize: v,
              leading: Math.round(el.leading * (v / el.fontSize) * 10) / 10,
            };
            // ...and keep a single-line box exactly one line tall, centred where it was.
            if (isSingleLineBox(el)) {
              const newH = Math.ceil(v * LINE_RATIO);
              patch.h = newH;
              patch.y = Math.max(0, Math.round(el.y + (el.h - newH) / 2));
            }
            onChange(patch);
          }}
          suffix="pt"
        />
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

function GoodsLayoutPanel({
  layout,
  onChange,
  repeatedCount,
  rowCapacity,
}: {
  layout: GoodsLayout;
  onChange: (patch: Partial<GoodsLayout>) => void;
  repeatedCount: number;
  rowCapacity: number;
}) {
  return (
    <div className="mt-2 border-t border-[#e5e8f0] pt-4">
      <SectionLabel>Goods line layout</SectionLabel>
      <p className="text-[11px] text-[#6a7a9a] leading-relaxed mb-3">
        Fields marked <strong>Repeated</strong> (Advanced section of a field) print once per goods line, stacked
        downward from where you place them. These settings are saved with the template; the generated PDF only
        follows them if the renderer reads them.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <NumberField
          label="Gap between lines"
          value={layout.rowGap}
          onChange={(v) => onChange({ rowGap: Math.max(0, v) })}
          suffix="pt"
        />
        <NumberField
          label="Stop growing at Y (0 = page bottom)"
          value={layout.tableBottomY}
          onChange={(v) => onChange({ tableBottomY: Math.max(0, v) })}
          suffix="pt"
        />
      </div>
      <label className="flex items-center gap-2 text-[12px] text-[#3a4560] mb-3">
        <input
          type="checkbox"
          checked={layout.autoRowHeight}
          onChange={(e) => onChange({ autoRowHeight: e.target.checked })}
          className="w-3.5 h-3.5"
        />
        Grow each line to fit its wrapped text
      </label>
      <p className="text-[10.5px] text-[#9aa5bb]">
        Repeated fields: {repeatedCount}
        {repeatedCount > 0 && <> · tallest line (at Max Lines): {rowCapacity} pt</>}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Template preview                                                    */
/* ------------------------------------------------------------------ */

// Designer view of the Goods Table: one band per column with a LEFT-aligned
// header title and a few faded sample rows. With "Print header row" on, the
// title row is drawn on the PDF too; with it off, titles are shown faded here
// only (the form already prints its own header).
function GoodsTableGlyph({ el }: { el: FieldElement }) {
  const cols = getGoodsColumns(el).filter((c) => c.enabled);
  const total = cols.reduce((s, c) => s + c.widthPct, 0) || 1;
  const showHeader = el.showHeader !== false;
  const headerH = goodsHeaderHeight(el);
  return (
    <div className="flex w-full h-full" style={{ fontSize: Math.min(el.fontSize, 9), lineHeight: 1.2 }}>
      {cols.map((c, i) => (
        <div
          key={c.key}
          className="h-full overflow-hidden"
          style={{
            width: `${(c.widthPct / total) * 100}%`,
            borderLeft: i === 0 ? 'none' : '1px dashed #8fc99c',
            color: '#1f6b32',
          }}
        >
          <div
            className="flex items-center justify-start text-left overflow-hidden"
            style={{
              fontWeight: 500,
              height: showHeader ? headerH : undefined,
              borderBottom: showHeader ? '1px solid #8fc99c' : 'none',
              padding: '0 3px',
              opacity: showHeader ? 1 : 0.5,
              fontStyle: showHeader ? 'normal' : 'italic',
            }}
            title={showHeader ? undefined : 'Not printed: the header row is turned off'}
          >
            {c.label}
          </div>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="truncate"
              style={{ opacity: 0.55, marginTop: 3, padding: '0 3px', textAlign: c.align }}
            >
              {sampleGoodsCell(c.key, n)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Preview of the table: white panel with ruled borders, a left-aligned header
// row (if on), then one row per goods line; a row grows to fit its wrapped
// text and the next row starts below it.
function GoodsRowsPreview({ el, rowGap }: { el: FieldElement; rowGap: number }) {
  const cols = getGoodsColumns(el).filter((c) => c.enabled);
  const total = cols.reduce((s, c) => s + c.widthPct, 0) || 1;
  const showHeader = el.showHeader !== false;
  const headerH = goodsHeaderHeight(el);
  const cellWidth = (c: GoodsColumn) => `${(c.widthPct / total) * 100}%`;
  const line = `${GOODS_BORDER_WIDTH}px solid ${GOODS_BORDER_COLOR}`;
  return (
    <div className="relative w-full self-stretch">
      {/* Column dividers run the full height of the table box */}
      <div className="absolute inset-0 flex pointer-events-none">
        {cols.map((c, i) => (
          <div key={c.key} style={{ width: cellWidth(c), borderLeft: i === 0 ? 'none' : line }} />
        ))}
      </div>

      {showHeader && (
        <div className="relative flex w-full" style={{ minHeight: headerH, borderBottom: line, marginBottom: rowGap }}>
          {cols.map((c) => (
            <div
              key={c.key}
              className="flex items-center"
              style={{ width: cellWidth(c), textAlign: 'left', fontWeight: 400, padding: '0 3px', overflowWrap: 'anywhere' }}
            >
              {c.label}
            </div>
          ))}
        </div>
      )}
      {[1, 2, 3].map((n) => (
        <div key={n} className="relative flex w-full" style={{ paddingBottom: rowGap }}>
          {cols.map((c) => (
            <div
              key={c.key}
              style={{ width: cellWidth(c), textAlign: c.align, padding: '0 3px', overflowWrap: 'anywhere' }}
            >
              {sampleGoodsCell(c.key, n)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function GoodsColumnsEditor({
  el,
  onChange,
}: {
  el: FieldElement;
  onChange: (patch: Partial<FieldElement>) => void;
}) {
  const cols = getGoodsColumns(el);
  const setCols = (next: GoodsColumn[]) => onChange({ goodsColumns: next });
  const update = (i: number, patch: Partial<GoodsColumn>) =>
    setCols(cols.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cols.length) return;
    const next = cols.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setCols(next);
  };
  const total = cols.filter((c) => c.enabled).reduce((s, c) => s + c.widthPct, 0);

  return (
    <div className="mb-4">
      <SectionLabel>Goods table columns</SectionLabel>
      <p className="text-[10.5px] text-[#6a7a9a] leading-relaxed mb-2">
        Each goods line prints as one row inside this box, growing to fit wrapped text. Order and widths must match
        the columns printed on the form; untick columns the form doesn&apos;t have. Remove any single fields
        (description, marks, etc.) you&apos;re replacing with this table, or they will print twice.
      </p>
      <label className="flex items-center gap-2 text-[12px] text-[#3a4560] mb-1">
        <input
          type="checkbox"
          checked={el.showHeader !== false}
          onChange={(e) => onChange({ showHeader: e.target.checked })}
          className="w-3.5 h-3.5"
        />
        Print the header row (column titles) on the PDF
      </label>
            <label className="flex items-center gap-2 text-[12px] text-[#3a4560] mb-1">
        <input
          type="checkbox"
          checked={el.autoHeight !== false}
          onChange={(e) => onChange({ autoHeight: e.target.checked })}
          className="w-3.5 h-3.5"
        />
        Expand height automatically to fit all goods lines
      </label>
      <p className="text-[10.5px] text-[#9aa5bb] mb-2">
        The box you draw is the minimum size. The table grows downward as lines are added.
      </p>
      <p className="text-[10.5px] text-[#9aa5bb] mb-2">
        Turn this off if the form already prints its own column headings.
      </p>
            <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[11px] text-[#6a7a9a]">Align all columns</span>
        {(['left', 'center', 'right'] as Align[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setCols(cols.map((c) => ({ ...c, align: a })))}
            className="px-2 py-0.5 border border-[#d1d5db] rounded text-[11px] hover:bg-[#f4f5f7] capitalize"
          >
            {a}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {cols.map((c, i) => (
          <div key={c.key} className="flex items-center gap-1.5 border border-[#e5e8f0] rounded px-1.5 py-1">
            <input
              type="checkbox"
              checked={c.enabled}
              onChange={(e) => update(i, { enabled: e.target.checked })}
              className="w-3.5 h-3.5"
              aria-label={`Show ${c.label}`}
            />
            <span className="flex-1 min-w-0 truncate text-[11.5px] text-[#1a2236]">{c.label}</span>
            <input
              type="number"
              min={1}
              value={c.widthPct}
              onChange={(e) => update(i, { widthPct: Math.max(1, Number(e.target.value)) })}
              className="w-11 px-1 py-0.5 border border-[#d1d5db] rounded text-[11px] text-center"
              aria-label={`${c.label} width percent`}
            />
            <span className="text-[10px] text-[#9aa5bb]">%</span>
            <select
              value={c.align}
              onChange={(e) => update(i, { align: e.target.value as Align })}
              className="px-1 py-0.5 border border-[#d1d5db] rounded text-[11px]"
              aria-label={`${c.label} alignment`}
            >
              <option value="left">L</option>
              <option value="center">C</option>
              <option value="right">R</option>
            </select>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="px-1 text-[12px] text-[#3a4560] disabled:opacity-30"
              aria-label={`Move ${c.label} left`}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === cols.length - 1}
              className="px-1 text-[12px] text-[#3a4560] disabled:opacity-30"
              aria-label={`Move ${c.label} right`}
            >
              ↓
            </button>
          </div>
        ))}
      </div>
      <p className="text-[10.5px] text-[#9aa5bb] mt-1.5">
        Enabled widths add up to {total}% (they are scaled to the table&apos;s width).
      </p>
    </div>
  );
}

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
  pageIndex,
  templateDataUrl,
  rowGap,
  onClose,
}: {
  elements: FieldElement[];
  pageW: number;
  pageH: number;
  pageIndex: number;
  templateDataUrl: string | null;
  rowGap: number;
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
                  <PdfBackdrop src={templateDataUrl} pageIndex={pageIndex} />
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
                                                height: el.kind === 'goods' && el.autoHeight !== false ? undefined : el.h,
                        minHeight: el.h,
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
                        // The goods table is printed on its own white panel with ruled borders.
                        background: el.kind === 'goods' ? '#ffffff' : showBoxes ? el.bg : 'transparent',
                        border:
                          el.kind === 'goods'
                            ? `${GOODS_BORDER_WIDTH}px solid ${GOODS_BORDER_COLOR}`
                            : showBoxes
                            ? `1px ${el.border === 'dashed' ? 'dashed' : 'solid'} ${colors.border}`
                            : 'none',
                        padding: `${el.pad.t}px ${el.pad.r}px ${el.pad.b}px ${el.pad.l}px`,
                        whiteSpace: el.wrap ? 'pre-wrap' : 'nowrap',
                      }}
                    >
                      {el.imageUrl ? (
                        <img src={el.imageUrl} alt={el.label} className="w-full h-full object-contain" />
                      ) : el.typeLabel === 'QR Code' ? (
                        <QrGlyph />
                      ) : el.typeLabel === 'Table' ? (
                        <GoodsRowsPreview el={el} rowGap={rowGap} />
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