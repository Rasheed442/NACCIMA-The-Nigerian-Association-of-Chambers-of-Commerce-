'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiPlus, FiZoomIn, FiZoomOut, FiMaximize, FiRotateCcw, FiRotateCw, FiGrid, FiEye, FiEyeOff, FiSave, FiDownload, FiMoreVertical } from 'react-icons/fi';
import General from './General';

type Align = 'left' | 'center' | 'right';
type VAlign = 'top' | 'middle' | 'bottom';
type BorderStyle = 'none' | 'solid' | 'dashed';

interface Padding {
  t: number;
  r: number;
  b: number;
  l: number;
}

interface FieldElement {
  id: string;
  text: string;
  subLabel: string;
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
  repeated: boolean;
  readOnly: boolean;
  border: BorderStyle;
  borderColor: string;
  pad: Padding;
  imageUrl?: string;
}

let idCounter = 1;
const uid = (prefix: string) => `${prefix}_${idCounter++}`;

const GREEN_BG = '#e6f5ea';
const GREEN_BORDER = '#8fc99c';
const GREEN_TEXT = '#1f6b32';
const PINK_BG = '#fdeceb';
const PINK_BORDER = '#e6a9a4';
const PINK_TEXT = '#a3352b';

function makeSeed(): FieldElement[] {
  const tags: Array<{
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    sub?: string;
    small?: boolean;
    pink?: boolean;
    border?: boolean;
  }> = [
    { label: 'SHIPPER_NAME', x: 36, y: 52, w: 230, h: 22 },
    { label: 'CONSIGNEE', x: 305, y: 52, w: 150, h: 22 },
    { label: 'CERTIFICATE_NUMBER', x: 730, y: 60, w: 190, h: 22, border: true },
    {
      label: 'COUNTRY_OF_MANUFACTURING',
      x: 600,
      y: 110,
      w: 280,
      h: 22,
      sub: '(Country)',
    },
    { label: 'TRANSPORT', x: 36, y: 190, w: 180, h: 22 },
    { label: 'ITEM_NO', x: 36, y: 280, w: 60, h: 20, small: true },
    { label: 'MARKS_NO', x: 100, y: 280, w: 70, h: 20, small: true },
    { label: 'DESCRIPTION', x: 190, y: 280, w: 270, h: 70 },
    { label: 'HS_CODE', x: 190, y: 355, w: 130, h: 20, small: true },
    { label: 'FOB_VALUE', x: 190, y: 377, w: 130, h: 20, small: true },
    { label: 'CRITERIA', x: 470, y: 280, w: 110, h: 20, small: true },
    { label: 'GROSS_WEIGHT', x: 590, y: 280, w: 130, h: 20, small: true },
    { label: 'INVOICE_NUMBER', x: 730, y: 280, w: 190, h: 20, small: true },
    { label: 'VALUE', x: 730, y: 355, w: 190, h: 20, small: true },
    {
      label: 'BOOKING_NUMBER',
      x: 36,
      y: 355,
      w: 150,
      h: 20,
      small: true,
      pink: true,
    },
    {
      label: 'COUNTRY_OF_MANUFACTURING',
      x: 170,
      y: 660,
      w: 230,
      h: 20,
      sub: '(country)',
    },
    {
      label: 'DESTINATION',
      x: 660,
      y: 695,
      w: 230,
      h: 20,
      sub: '(Importing country)',
    },
    { label: 'ORIGIN', x: 660, y: 735, w: 110, h: 20, pink: true },
    { label: 'SIGNATURE', x: 400, y: 730, w: 150, h: 22, pink: true },
  ];

  return tags.map((t) => ({
    id: uid('el'),
    text: t.label,
    subLabel: t.sub ?? '',
    x: t.x,
    y: t.y,
    w: t.w,
    h: t.h,
    fontSize: t.small ? 9.5 : 11.5,
    leading: 9.5,
    fontFamily: 'Helvetica',
    bold: false,
    italic: false,
    underline: false,
    align: 'center',
    valign: 'middle',
    color: t.pink ? PINK_TEXT : GREEN_TEXT,
    bg: t.pink ? PINK_BG : GREEN_BG,
    wrap: true,
    repeated: false,
    readOnly: !!t.border,
    border: t.border ? 'dashed' : 'none',
    borderColor: '#2f5fdb',
    pad: { t: 2, r: 2, b: 2, l: 2 },
  }));
}

interface TypeDefault {
  label: string;
  w: number;
  h: number;
}

const TYPE_DEFAULTS: Record<string, TypeDefault> = {
  text: { label: 'NEW_FIELD', w: 150, h: 22 },
  multiline: { label: 'NEW_MULTILINE', w: 220, h: 60 },
  number: { label: 'NEW_NUMBER', w: 100, h: 22 },
  date: { label: 'NEW_DATE', w: 110, h: 22 },
  checkbox: { label: 'NEW_CHECKBOX', w: 22, h: 22 },
  dropdown: { label: 'NEW_DROPDOWN', w: 150, h: 22 },
  goodstable: { label: 'GOODS_TABLE', w: 400, h: 120 },
  doctable: { label: 'DOCUMENT_TABLE', w: 400, h: 120 },
  qrcode: { label: 'QR_CODE', w: 80, h: 80 },
  vcode: { label: 'VERIFICATION_CODE', w: 200, h: 24 },
  logo: { label: 'BADGE_LOGO', w: 100, h: 100 },
  barcode: { label: 'BARCODE', w: 180, h: 50 },
};

const COMPONENT_GROUPS: Array<{
  label: string;
  items: Array<{ type: string; label: string; icon: string }>;
}> = [
  {
    label: 'Basic fields',
    items: [
      { type: 'text', label: 'Text field', icon: 'T' },
      { type: 'multiline', label: 'Multi-line text', icon: '≡' },
      { type: 'number', label: 'Number', icon: '#' },
      { type: 'date', label: 'Date', icon: '📅' },
      { type: 'checkbox', label: 'Checkbox', icon: '☑' },
      { type: 'dropdown', label: 'Dropdown', icon: '▾' },
    ],
  },
  {
    label: 'Table components',
    items: [
      { type: 'goodstable', label: 'Goods table', icon: '▦' },
      { type: 'doctable', label: 'Document table', icon: '≡' },
    ],
  },
  {
    label: 'Special components',
    items: [
      { type: 'qrcode', label: 'QR code', icon: '▤' },
      { type: 'vcode', label: 'Verification code', icon: '✓' },
      { type: 'logo', label: 'Badge / logo', icon: '◎' },
      { type: 'barcode', label: 'Barcode', icon: '≡' },
    ],
  },
];

const TABS = [
    { id: 'general', label: 'General' },
      { id: 'applicable-fields', label: 'Applicable Fields' },
      { id: 'required-documents', label: 'Required Documents' },

  { id: 'template-designer', label: 'Template Designer' },
  { id: 'membering-format', label: 'Membering & Format' },
  { id: 'Fee', label: 'Fee & changes' },
];

export function TemplateDesigner() {
  const [activeTab, setActiveTab] = useState('general');
  const [elements, setElements] = useState<FieldElement[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('template-designer-elements');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return makeSeed();
        }
      }
    }
    return makeSeed();
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('template-designer-zoom');
      return saved ? Number(saved) : 1;
    }
    return 1;
  });
  const [gridOn, setGridOn] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('template-designer-grid');
      return saved === 'true';
    }
    return true;
  });
  const [boundsOn, setBoundsOn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [panX, setPanX] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('template-designer-panX');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });
  const [panY, setPanY] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('template-designer-panY');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  } | null>(null);

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  const updateSelected = useCallback(
    (patch: Partial<FieldElement>) => {
      if (!selectedId) return;
      setElements((prev) =>
        prev.map((e) => (e.id === selectedId ? { ...e, ...patch } : e))
      );
    },
    [selectedId]
  );

  const updateSelectedPad = useCallback(
    (patch: Partial<Padding>) => {
      if (!selectedId) return;
      setElements((prev) =>
        prev.map((e) =>
          e.id === selectedId ? { ...e, pad: { ...e.pad, ...patch } } : e
        )
      );
    },
    [selectedId]
  );

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const addComponent = useCallback((type: string, x?: number, y?: number) => {
    const d = TYPE_DEFAULTS[type] ?? { label: 'NEW_FIELD', w: 150, h: 22 };
    const el: FieldElement = {
      id: uid('el'),
      text: d.label,
      subLabel: '',
      x: x ?? 60,
      y: y ?? 60,
      w: d.w,
      h: d.h,
      fontSize: 11.5,
      leading: 9.5,
      fontFamily: 'Helvetica',
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
      valign: 'middle',
      color: GREEN_TEXT,
      bg: GREEN_BG,
      wrap: true,
      repeated: false,
      readOnly: false,
      border: 'none',
      borderColor: '#2f5fdb',
      pad: { t: 2, r: 2, b: 2, l: 2 },
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  }, []);

  const onElMouseDown = (e: React.MouseEvent, el: FieldElement) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    dragRef.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
    };
  };

  const onDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!type || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom - panX / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom - panY / zoom);
    addComponent(type, x, y);
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== gridRef.current) return;
    e.preventDefault();
    setSelectedId(null);
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origPanX: panX,
      origPanY: panY,
    };
  };

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const drag = dragRef.current;
      const pan = panRef.current;
      
      if (drag) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const nx = Math.max(0, Math.round(drag.origX + dx / zoom));
        const ny = Math.max(0, Math.round(drag.origY + dy / zoom));
        setElements((prev) =>
          prev.map((el) => (el.id === drag.id ? { ...el, x: nx, y: ny } : el))
        );
      }
      
      if (pan) {
        const dx = e.clientX - pan.startX;
        const dy = e.clientY - pan.startY;
        const containerWidth = 1600 * zoom;
        const containerHeight = 1200 * zoom;
        const contentWidth = 1460 * zoom;
        const contentHeight = 868 * zoom;
        
        // Calculate bounds to prevent dragging outside
        const maxPanX = 0;
        const minPanX = containerWidth - contentWidth;
        const maxPanY = 0;
        const minPanY = containerHeight - contentHeight;
        
        const newPanX = Math.max(minPanX, Math.min(maxPanX, pan.origPanX + dx));
        const newPanY = Math.max(minPanY, Math.min(maxPanY, pan.origPanY + dy));
        
        setPanX(newPanX);
        setPanY(newPanY);
      }
    }
    function onUp() {
      dragRef.current = null;
      panRef.current = null;
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [zoom, panX, panY]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const activeTag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedId &&
        activeTag !== 'INPUT' &&
        activeTag !== 'TEXTAREA'
      ) {
        deleteElement(selectedId);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, deleteElement]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('template-designer-elements', JSON.stringify(elements));
  }, [elements]);

  useEffect(() => {
    localStorage.setItem('template-designer-zoom', String(zoom));
  }, [zoom]);

  useEffect(() => {
    localStorage.setItem('template-designer-grid', String(gridOn));
  }, [gridOn]);

  useEffect(() => {
    localStorage.setItem('template-designer-panX', String(panX));
  }, [panX]);

  useEffect(() => {
    localStorage.setItem('template-designer-panY', String(panY));
  }, [panY]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#dde3ee] bg-white">
        <div>
          <h1 className="text-[18px] font-semibold text-[#1a2236] flex items-center gap-2">
            Edit Certificate Type
            <span className="text-[11px] font-semibold text-green-800 bg-green-100 border border-green-600 px-2 py-0.5 rounded-full">
              Active
            </span>
          </h1>
          <p className="text-[12px] text-[#6a7a9a] mt-0.5">
            Configure template layout, fields, and rules for certificate type
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
            className={`px-3 py-1.5 rounded text-[13px] font-medium flex items-center gap-1 ${
              saved
                ? 'bg-[#1f8a44] text-white'
                : 'bg-[#1a4a8a] text-white hover:bg-[#153c70]'
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

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 px-4 py-3 my-4 bg-white border-b border-[#dde3ee]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-[#1a4a8a] text-white'
                : 'bg-[#f4f5f7] text-[#4a5a7a] hover:bg-[#e8eef5]'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="flex-1 overflow-auto bg-[#f9fafb] ">
          <General />
        </div>
      )}

      {activeTab === 'template-designer' && (
        <>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#dde3ee] bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[#d1d5db] rounded-lg overflow-hidden">
            <button
              className="p-2 hover:bg-[#e8f0fe] transition-colors"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              title="Zoom out"
            >
              <FiZoomOut size={16} className="text-[#1a4a8a]" />
            </button>
            <div className="w-px h-5 bg-[#d1d5db]" />
            <span className="px-3 text-[13px] font-medium text-[#1a2236] min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <div className="w-px h-5 bg-[#d1d5db]" />
            <button
              className="p-2 hover:bg-[#e8f0fe] transition-colors"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              title="Zoom in"
            >
              <FiZoomIn size={16} className="text-[#1a4a8a]" />
            </button>
          </div>
          <button
            className="px-4 py-2 border border-[#d1d5db] rounded-lg text-[13px] font-medium text-[#1a2236] hover:bg-[#e8f0fe] hover:border-[#1a4a8a] transition-all"
            onClick={() => setZoom(1)}
          >
            Fit to screen
          </button>
          <div className="w-px h-6 bg-[#dde3ee]" />
          <button className="p-2 border border-[#d1d5db] rounded-lg hover:bg-[#e8f0fe] hover:border-[#1a4a8a] transition-all" title="Rotate left">
            <FiRotateCcw size={16} className="text-[#1a4a8a]" />
          </button>
          <button className="p-2 border border-[#d1d5db] rounded-lg hover:bg-[#e8f0fe] hover:border-[#1a4a8a] transition-all" title="Rotate right">
            <FiRotateCw size={16} className="text-[#1a4a8a]" />
          </button>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-[#1a2236]">Grid</span>
            <button
              className={`w-11 h-6 rounded-full transition-colors ${
                gridOn ? 'bg-[#1a4a8a]' : 'bg-[#d1d5db]'
              }`}
              onClick={() => setGridOn((v) => !v)}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  gridOn ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-[#1a2236]">Show bounds</span>
            <button
              className={`w-11 h-6 rounded-full transition-colors ${
                boundsOn ? 'bg-[#1a4a8a]' : 'bg-[#d1d5db]'
              }`}
              onClick={() => setBoundsOn((v) => !v)}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  boundsOn ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Components */}
        <div className="w-72 border-r border-[#dde3ee] bg-white overflow-y-auto">
          <div className="p-5 border-b border-[#dde3ee]">
            <h2 className="text-[15px] font-semibold text-[#1a2236] mb-1">Components</h2>
            <p className="text-[12px] text-[#6a7a9a]">
              Drag and drop onto the template
            </p>
          </div>

          <div className="p-4">
            {COMPONENT_GROUPS.map((group, groupIndex) => (
              <div key={group.label}>
                <div className="text-[11px] font-bold text-[#1a4a8a] uppercase tracking-wider mb-3 mt-5 first:mt-0">
                  {group.label}
                </div>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center gap-3 px-4 py-3 border border-[#d1d5db] rounded-xl cursor-grab hover:border-[#1a4a8a] hover:bg-[#e8f0fe] hover:shadow-md transition-all group"
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData('text/plain', item.type)
                      }
                      onClick={() => addComponent(item.type)}
                    >
                      <span className="text-[#6a7a7a] text-lg group-hover:text-[#1a4a8a] transition-colors">{item.icon}</span>
                      <span className="text-[13px] font-medium text-[#1a2236]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-gradient-to-br from-[#e8f0fe] to-[#f0f7ff] rounded-xl border border-[#d4e6fd]">
              <div className="flex items-start gap-2">
                <span className="text-[#1a4a8a] text-sm">💡</span>
                <div className="text-[12px] text-[#1a2236] leading-relaxed">
                  <strong className="text-[#1a4a8a]">Tip:</strong> Drag a component onto the template. Click it to edit properties.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gradient-to-br from-[#e8ecf1] to-[#dfe2e7] overflow-auto flex justify-center p-2">
          <div
            className="bg-white shadow-2xl relative overflow-auto rounded-lg"
            style={{
              width: '1600px',
              height: '1200px',
            }}
          >
            <div 
              className="absolute inset-0"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              <div
                ref={gridRef}
                className="relative "
                style={{
                  height: '0px',
                  backgroundImage: gridOn
                    ? 'linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)'
                    : undefined,
                  backgroundSize: '20px 20px',
                  transform: `translate(${10}px, ${10}px)`,
                  // transform: `translate(${panX}px, ${panY}px)`,
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropOnCanvas}
                onMouseDown={onCanvasMouseDown}
              >
                <div className="text-center text-[26px] font-bold tracking-widest border-b-2 border-[#222] ">
                  ORIGINAL
                </div>
              {/* Numbered Sections */}
              <div className="absolute inset-0 pointer-events-none ">
                {/* Section 1 - Exporter Details */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '5px', top: '65px', width: '450px', height: '80px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Exporter Details</div>
                </div>

                {/* Section 2 - Consignee Details */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '475px', top: '65px', width: '450px', height: '80px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Consignee Details</div>
                </div>

                {/* Section 3 - Certificate Number */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '5px', top: '160px', width: '200px', height: '60px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Certificate No.</div>
                </div>

                {/* Section 4 - Country of Origin */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '230px', top: '160px', width: '350px', height: '60px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Country of Origin</div>
                </div>

                {/* Section 5 - Transport Details */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '600px', top: '160px', width: '330px', height: '60px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Transport Details</div>
                </div>

                {/* Section 6 - Goods Table */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '5px', top: '240px', width: '920px', height: '300px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">6</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Goods Description</div>
                </div>

                {/* Section 7 - Declaration */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '5px', top: '560px', width: '450px', height: '120px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">7</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Declaration</div>
                </div>

                {/* Section 8 - Certification */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '475px', top: '560px', width: '450px', height: '120px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">8</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Certification</div>
                </div>

                {/* Section 9 - Signature */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '5px', top: '700px', width: '300px', height: '80px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">9</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Signature</div>
                </div>

                {/* Section 10 - Date */}
                <div className="absolute border-2   bg-[#f1f5f9]/30" style={{ left: '320px', top: '700px', width: '200px', height: '80px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">10</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Date</div>
                </div>

                {/* Section 11 - Stamp */}
                <div className="absolute border-2  bg-[#f1f5f9]/30" style={{ left: '535px', top: '700px', width: '380px', height: '80px' }}>
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#1a4a8a] text-white rounded-full flex items-center justify-center text-xs font-bold">11</div>
                  <div className="absolute top-1 left-2 text-[10px] text-[#64748b] font-medium">Official Stamp</div>
                </div>
              </div>

              {elements.map((el) => (
                <div
                  key={el.id}
                  className={`absolute cursor-move overflow-hidden flex items-center rounded-md font-semibold text-[11.5px] ${
                    el.id === selectedId ? 'outline-2 outline outline-[#1a4a8a]' : ''
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
                    justifyContent:
                      el.align === 'left'
                        ? 'flex-start'
                        : el.align === 'right'
                        ? 'flex-end'
                        : 'center',
                    color: el.color,
                    background: el.bg,
                    border:
                      el.border === 'none'
                        ? `1px solid ${
                            el.bg === PINK_BG ? PINK_BORDER : GREEN_BORDER
                          }`
                        : `1.5px ${el.border} ${el.borderColor}`,
                    padding: `${el.pad.t}px ${el.pad.r}px ${el.pad.b}px ${el.pad.l}px`,
                    whiteSpace: el.wrap ? 'pre-wrap' : 'nowrap',
                    outline: boundsOn ? '1px dotted #bbb' : undefined,
                  }}
                >
                  {el.imageUrl ? (
                    <img src={el.imageUrl} alt={el.text} className="w-full h-full object-contain" />
                  ) : (
                    el.text
                  )}
                  {el.subLabel && !el.imageUrl && (
                    <div className="absolute left-0 right-0 -bottom-3.5 text-center text-[8.5px] text-[#555]">
                      {el.subLabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#dde3ee] px-4 py-1.5 text-[11px] text-[#6a7a9a] flex gap-4">
              <span>Page 1 / 1</span>
              <span>Components: {elements.length}</span>
              <span>Selected: {selected ? selected.text : 'none'}</span>
            </div>
            </div>
          </div>
        </div>

        {/* Right panel - Properties */}
        <div className="w-80 border-l border-[#dde3ee] bg-white overflow-y-auto">
          <div className="p-5 border-b border-[#dde3ee]">
            <h2 className="text-[15px] font-semibold text-[#1a2236] mb-1">Properties</h2>
            <p className="text-[12px] text-[#6a7a9a]">
              Edit selected component properties
            </p>
          </div>
          <div className="p-5">
            {!selected ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-[#f9fafb] rounded-full flex items-center justify-center mb-4">
                  <FiEye size={24} className="text-[#9ca3af]" />
                </div>
                <p className="text-[13px] text-[#6a7a9a] leading-relaxed">
                  Select a component on the template to edit its position, size,
                  typography and colors here.
                </p>
              </div>
            ) : (
              <PropertiesForm
                el={selected}
                onChange={updateSelected}
                onChangePad={updateSelectedPad}
                onDelete={() => deleteElement(selected.id)}
              />
            )}
          </div>
        </div>
      </div>
        </>
      )}
      
      {activeTab === 'field-mapping' && (
        <div className="flex-1 flex items-center justify-center bg-[#f9fafb]">
          <div className="text-center">
            <p className="text-[14px] text-[#6a7a9a]">Field Mapping</p>
            <p className="text-[12px] text-[#9ca3af] mt-1">Map form fields to certificate template</p>
          </div>
        </div>
      )}
      
      {activeTab === 'validation-rules' && (
        <div className="flex-1 flex items-center justify-center bg-[#f9fafb]">
          <div className="text-center">
            <p className="text-[14px] text-[#6a7a9a]">Validation Rules</p>
            <p className="text-[12px] text-[#9ca3af] mt-1">Configure field validation logic</p>
          </div>
        </div>
      )}
      
      {activeTab === 'preview' && (
        <div className="flex-1 flex items-center justify-center bg-[#f9fafb]">
          <div className="text-center">
            <p className="text-[14px] text-[#6a7a9a]">Preview</p>
            <p className="text-[12px] text-[#9ca3af] mt-1">Preview the certificate template</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertiesForm({
  el,
  onChange,
  onChangePad,
  onDelete,
}: {
  el: FieldElement;
  onChange: (patch: Partial<FieldElement>) => void;
  onChangePad: (patch: Partial<Padding>) => void;
  onDelete: () => void;
}) {
  const fontSizes = [8, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14, 16];
  const leadings = [8, 9, 9.5, 10, 10.5, 11, 12, 13, 14];
  const fontFamilies = ['Helvetica', 'Arial', 'Times New Roman', 'Courier New', 'Georgia'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange({ imageUrl: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="text-[11px] text-[#6a7a9a] mb-0.5">Field text</div>
      <div className="text-[13px] font-semibold text-[#1a2236] mb-4 break-words">
        ID · {el.text}
      </div>

      {el.text === 'BADGE_LOGO' && (
        <div className="mb-4">
          <label className="block text-[14px] text-[#6a7a9a] mb-1">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
          />
          {el.imageUrl && (
            <div className="mt-2">
              <img src={el.imageUrl} alt="Logo preview" className="w-full h-24 object-contain border border-[#d1d5db] rounded" />
              <button
                onClick={() => onChange({ imageUrl: undefined })}
                className="mt-1 text-[11px] text-red-600 hover:text-red-700"
              >
                Remove image
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">X</label>
          <input
            type="number"
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
            value={el.x}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Y</label>
          <input
            type="number"
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
            value={el.y}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Width</label>
          <input
            type="number"
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
            value={el.w}
            onChange={(e) => onChange({ w: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Height</label>
          <input
            type="number"
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
            value={el.h}
            onChange={(e) => onChange({ h: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Font size</label>
          <select
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
            value={el.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          >
            {fontSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Leading</label>
          <select
            className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
            value={el.leading}
            onChange={(e) => onChange({ leading: Number(e.target.value) })}
          >
            {leadings.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-[11px] text-[#6a7a9a] mb-1">Font family</label>
        <select
          className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
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

      <div className="mb-3">
        <label className="block text-[11px] text-[#6a7a9a] mb-1">Font style</label>
        <div className="flex border border-[#d1d5db] rounded overflow-hidden">
          <button
            className={`flex-1 py-1.5 text-[12px] border-r border-[#d1d5db] ${
              el.bold ? 'bg-[#f0f7ff] text-[#1a4a8a] font-bold' : 'hover:bg-[#f4f5f7]'
            }`}
            onClick={() => onChange({ bold: !el.bold })}
          >
            B
          </button>
          <button
            className={`flex-1 py-1.5 text-[12px] border-r border-[#d1d5db] ${
              el.italic ? 'bg-[#f0f7ff] text-[#1a4a8a] italic' : 'hover:bg-[#f4f5f7]'
            }`}
            onClick={() => onChange({ italic: !el.italic })}
          >
            I
          </button>
          <button
            className={`flex-1 py-1.5 text-[12px] ${
              el.underline ? 'bg-[#f0f7ff] text-[#1a4a8a] underline' : 'hover:bg-[#f4f5f7]'
            }`}
            onClick={() => onChange({ underline: !el.underline })}
          >
            U
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Text align</label>
          <div className="flex border border-[#d1d5db] rounded overflow-hidden">
            {(['left', 'center', 'right'] as Align[]).map((a) => (
              <button
                key={a}
                className={`flex-1 py-1.5 text-[12px] border-r border-[#d1d5db] last:border-r-0 ${
                  el.align === a ? 'bg-[#f0f7ff] text-[#1a4a8a]' : 'hover:bg-[#f4f5f7]'
                }`}
                onClick={() => onChange({ align: a })}
              >
                {a === 'left' ? '←' : a === 'right' ? '→' : '↔'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Vertical align</label>
          <div className="flex border border-[#d1d5db] rounded overflow-hidden">
            {(['top', 'middle', 'bottom'] as VAlign[]).map((v) => (
              <button
                key={v}
                className={`flex-1 py-1.5 text-[12px] border-r border-[#d1d5db] last:border-r-0 ${
                  el.valign === v ? 'bg-[#f0f7ff] text-[#1a4a8a]' : 'hover:bg-[#f4f5f7]'
                }`}
                onClick={() => onChange({ valign: v })}
              >
                {v[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Text color</label>
          <div className="flex items-center gap-2 border border-[#d1d5db] rounded px-2 py-1">
            <input
              type="color"
              className="w-5 h-5 border-0 p-0 rounded cursor-pointer"
              value={el.color}
              onChange={(e) => onChange({ color: e.target.value })}
            />
            <span className="text-[12px] text-[#6a7a9a] uppercase">{el.color}</span>
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-[#6a7a9a] mb-1">Background</label>
          <div className="flex items-center gap-2 border border-[#d1d5db] rounded px-2 py-1">
            <input
              type="color"
              className="w-5 h-5 border-0 p-0 rounded cursor-pointer"
              value={el.bg}
              onChange={(e) => onChange({ bg: e.target.value })}
            />
            <span className="text-[12px] text-[#6a7a9a] uppercase">{el.bg}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 text-[12px]">
        <input
          type="checkbox"
          checked={el.wrap}
          onChange={(e) => onChange({ wrap: e.target.checked })}
          className="w-4 h-4"
        />
        Wrap text
      </div>
      <div className="flex items-center gap-2 mb-2 text-[12px]">
        <input
          type="checkbox"
          checked={el.repeated}
          onChange={(e) => onChange({ repeated: e.target.checked })}
          className="w-4 h-4"
        />
        Repeated field
      </div>
      <div className="flex items-center gap-2 mb-3 text-[12px]">
        <input
          type="checkbox"
          checked={el.readOnly}
          onChange={(e) => onChange({ readOnly: e.target.checked })}
          className="w-4 h-4"
        />
        Read only
      </div>

      <div className="mb-3">
        <label className="block text-[11px] text-[#6a7a9a] mb-1">Border</label>
        <select
          className="w-full px-2 py-1.5 border border-[#d1d5db] rounded text-[12px]"
          value={el.border}
          onChange={(e) => onChange({ border: e.target.value as BorderStyle })}
        >
          <option value="none">None</option>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="block text-[11px] text-[#6a7a9a] mb-1">Padding</label>
        <div className="grid grid-cols-4 gap-1">
          <div>
            <label className="block text-[9px] text-[#6a7a9a] text-center mb-1">Top</label>
            <input
              type="number"
              className="w-full px-1 py-1 border border-[#d1d5db] rounded text-[11px] text-center"
              value={el.pad.t}
              onChange={(e) => onChangePad({ t: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-[9px] text-[#6a7a9a] text-center mb-1">Right</label>
            <input
              type="number"
              className="w-full px-1 py-1 border border-[#d1d5db] rounded text-[11px] text-center"
              value={el.pad.r}
              onChange={(e) => onChangePad({ r: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-[9px] text-[#6a7a9a] text-center mb-1">Bottom</label>
            <input
              type="number"
              className="w-full px-1 py-1 border border-[#d1d5db] rounded text-[11px] text-center"
              value={el.pad.b}
              onChange={(e) => onChangePad({ b: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-[9px] text-[#6a7a9a] text-center mb-1">Left</label>
            <input
              type="number"
              className="w-full px-1 py-1 border border-[#d1d5db] rounded text-[11px] text-center"
              value={el.pad.l}
              onChange={(e) => onChangePad({ l: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <button
        className="w-full py-2 border border-[#f0b4b0] bg-white text-[#dc2626] rounded text-[13px] font-semibold cursor-pointer hover:bg-[#fdeceb] mt-4"
        onClick={onDelete}
      >
        Delete component
      </button>
    </div>
  );
}
