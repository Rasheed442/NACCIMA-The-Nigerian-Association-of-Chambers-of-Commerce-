"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./TemplateDesigner.module.css";

type Align = "left" | "center" | "right";
type VAlign = "top" | "middle" | "bottom";
type BorderStyle = "none" | "solid" | "dashed";

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
}

let idCounter = 1;
const uid = (prefix: string) => `${prefix}_${idCounter++}`;

const GREEN_BG = "#e6f5ea";
const GREEN_BORDER = "#8fc99c";
const GREEN_TEXT = "#1f6b32";
const PINK_BG = "#fdeceb";
const PINK_BORDER = "#e6a9a4";
const PINK_TEXT = "#a3352b";

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
    { label: "SHIPPER_NAME", x: 36, y: 52, w: 230, h: 22 },
    { label: "CONSIGNEE", x: 305, y: 52, w: 150, h: 22 },
    { label: "CERTIFICATE_NUMBER", x: 730, y: 60, w: 190, h: 22, border: true },
    {
      label: "COUNTRY_OF_MANUFACTURING",
      x: 600,
      y: 110,
      w: 280,
      h: 22,
      sub: "(Country)",
    },
    { label: "TRANSPORT", x: 36, y: 190, w: 180, h: 22 },
    { label: "ITEM_NO", x: 36, y: 280, w: 60, h: 20, small: true },
    { label: "MARKS_NO", x: 100, y: 280, w: 70, h: 20, small: true },
    { label: "DESCRIPTION", x: 190, y: 280, w: 270, h: 70 },
    { label: "HS_CODE", x: 190, y: 355, w: 130, h: 20, small: true },
    { label: "FOB_VALUE", x: 190, y: 377, w: 130, h: 20, small: true },
    { label: "CRITERIA", x: 470, y: 280, w: 110, h: 20, small: true },
    { label: "GROSS_WEIGHT", x: 590, y: 280, w: 130, h: 20, small: true },
    { label: "INVOICE_NUMBER", x: 730, y: 280, w: 190, h: 20, small: true },
    { label: "VALUE", x: 730, y: 355, w: 190, h: 20, small: true },
    {
      label: "BOOKING_NUMBER",
      x: 36,
      y: 355,
      w: 150,
      h: 20,
      small: true,
      pink: true,
    },
    {
      label: "COUNTRY_OF_MANUFACTURING",
      x: 170,
      y: 660,
      w: 230,
      h: 20,
      sub: "(country)",
    },
    {
      label: "DESTINATION",
      x: 660,
      y: 695,
      w: 230,
      h: 20,
      sub: "(Importing country)",
    },
    { label: "ORIGIN", x: 660, y: 735, w: 110, h: 20, pink: true },
    { label: "SIGNATURE", x: 400, y: 730, w: 150, h: 22, pink: true },
  ];

  return tags.map((t) => ({
    id: uid("el"),
    text: t.label,
    subLabel: t.sub ?? "",
    x: t.x,
    y: t.y,
    w: t.w,
    h: t.h,
    fontSize: t.small ? 9.5 : 11.5,
    leading: 9.5,
    fontFamily: "Helvetica",
    bold: false,
    italic: false,
    underline: false,
    align: "center",
    valign: "middle",
    color: t.pink ? PINK_TEXT : GREEN_TEXT,
    bg: t.pink ? PINK_BG : GREEN_BG,
    wrap: true,
    repeated: false,
    readOnly: !!t.border,
    border: t.border ? "dashed" : "none",
    borderColor: "#2f5fdb",
    pad: { t: 2, r: 2, b: 2, l: 2 },
  }));
}

interface TypeDefault {
  label: string;
  w: number;
  h: number;
}

const TYPE_DEFAULTS: Record<string, TypeDefault> = {
  text: { label: "NEW_FIELD", w: 150, h: 22 },
  multiline: { label: "NEW_MULTILINE", w: 220, h: 60 },
  number: { label: "NEW_NUMBER", w: 100, h: 22 },
  date: { label: "NEW_DATE", w: 110, h: 22 },
  checkbox: { label: "NEW_CHECKBOX", w: 22, h: 22 },
  dropdown: { label: "NEW_DROPDOWN", w: 150, h: 22 },
  goodstable: { label: "GOODS_TABLE", w: 400, h: 120 },
  doctable: { label: "DOCUMENT_TABLE", w: 400, h: 120 },
  qrcode: { label: "QR_CODE", w: 80, h: 80 },
  vcode: { label: "VERIFICATION_CODE", w: 200, h: 24 },
  logo: { label: "BADGE_LOGO", w: 100, h: 100 },
  barcode: { label: "BARCODE", w: 180, h: 50 },
};

const COMPONENT_GROUPS: Array<{
  label: string;
  items: Array<{ type: string; label: string; icon: string }>;
}> = [
  {
    label: "Basic fields",
    items: [
      { type: "text", label: "Text field", icon: "T" },
      { type: "multiline", label: "Multi-line text", icon: "\u2630" },
      { type: "number", label: "Number", icon: "#" },
      { type: "date", label: "Date", icon: "\uD83D\uDCC5" },
      { type: "checkbox", label: "Checkbox", icon: "\u2611" },
      { type: "dropdown", label: "Dropdown", icon: "\u25BE" },
    ],
  },
  {
    label: "Table components",
    items: [
      { type: "goodstable", label: "Goods table", icon: "\u2588" },
      { type: "doctable", label: "Document table", icon: "\u2630" },
    ],
  },
  {
    label: "Special components",
    items: [
      { type: "qrcode", label: "QR code", icon: "\u25A4" },
      { type: "vcode", label: "Verification code", icon: "\u2713" },
      { type: "logo", label: "Badge / logo", icon: "\u25C9" },
      { type: "barcode", label: "Barcode", icon: "\u2630" },
    ],
  },
];

const TABS = [
  "General",
  "Applicable fields",
  "Required documents",
  "Template designer",
  "Numbering and format",
  "Fees and charges",
];

export default function TemplateDesigner() {
  const [elements, setElements] = useState<FieldElement[]>(() => makeSeed());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [gridOn, setGridOn] = useState(true);
  const [boundsOn, setBoundsOn] = useState(false);
  const [activeTab, setActiveTab] = useState(3);
  const [saved, setSaved] = useState(false);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
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
    const d = TYPE_DEFAULTS[type] ?? { label: "NEW_FIELD", w: 150, h: 22 };
    const el: FieldElement = {
      id: uid("el"),
      text: d.label,
      subLabel: "",
      x: x ?? 60,
      y: y ?? 60,
      w: d.w,
      h: d.h,
      fontSize: 11.5,
      leading: 9.5,
      fontFamily: "Helvetica",
      bold: false,
      italic: false,
      underline: false,
      align: "center",
      valign: "middle",
      color: GREEN_TEXT,
      bg: GREEN_BG,
      wrap: true,
      repeated: false,
      readOnly: false,
      border: "none",
      borderColor: "#2f5fdb",
      pad: { t: 2, r: 2, b: 2, l: 2 },
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  }, []);

  /* ---- drag to move ---- */
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

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / zoom;
      const dy = (e.clientY - drag.startY) / zoom;
      const nx = Math.max(0, Math.round(drag.origX + dx));
      const ny = Math.max(0, Math.round(drag.origY + dy));
      setElements((prev) =>
        prev.map((el) => (el.id === drag.id ? { ...el, x: nx, y: ny } : el))
      );
    }
    function onUp() {
      dragRef.current = null;
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [zoom]);

  /* ---- drag from left panel onto canvas ---- */
  const onDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain");
    if (!type || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);
    addComponent(type, x, y);
  };

  /* ---- keyboard delete ---- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const activeTag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId &&
        activeTag !== "INPUT" &&
        activeTag !== "TEXTAREA"
      ) {
        deleteElement(selectedId);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, deleteElement]);

  const handleTabClick = (i: number) => {
    if (i === 3) {
      setActiveTab(3);
      return;
    }
    window.alert(
      `"${TABS[i]}" tab is not part of this prototype. Template designer holds the working demo.`
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <h1>
            Edit certificate type <span className={styles.badge}>Active</span>
          </h1>
          <p>Configure template layout, fields, and rules for this certificate type</p>
        </div>
        <div className={styles.topbarRight}>
          <div className={styles.ctSelect}>
            <label>Certificate type</label>
            <select>
              <option>Certificate of origin (NACCIMA-CO)</option>
              <option>Certificate of inspection</option>
              <option>Phytosanitary certificate</option>
            </select>
          </div>
          <button className={styles.btn}>Preview PDF</button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSave}
          >
            {saved ? "Saved" : "Save changes"}
          </button>
          <button className={styles.iconBtn} aria-label="More options">
            &#8942;
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === i ? styles.tabActive : ""}`}
            onClick={() => handleTabClick(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <div className={styles.zoomCtl}>
            <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}>
              &minus;
            </button>
            <span className={styles.zoomVal}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
              &plus;
            </button>
          </div>
          <button className={styles.btn} onClick={() => setZoom(1)}>
            Fit width
          </button>
          <div className={styles.divider} />
          <button className={styles.iconBtn} title="Undo">
            &#8630;
          </button>
          <button className={styles.iconBtn} title="Redo">
            &#8631;
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          <div className={styles.toggleRow}>
            <span>Grid</span>
            <div
              className={`${styles.switch} ${gridOn ? styles.switchOn : ""}`}
              onClick={() => setGridOn((v) => !v)}
            />
          </div>
          <div className={styles.toggleRow}>
            <span>Show bounds</span>
            <div
              className={`${styles.switch} ${boundsOn ? styles.switchOn : ""}`}
              onClick={() => setBoundsOn((v) => !v)}
            />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className={styles.main}>
        {/* Left panel */}
        <div className={styles.panelLeft}>
          <h2>Components</h2>
          <p className={styles.hint}>Drag and drop onto the template</p>

          {COMPONENT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className={styles.groupLabel}>{group.label}</div>
              {group.items.map((item) => (
                <div
                  key={item.type}
                  className={styles.compItem}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", item.type)
                  }
                  onClick={() => addComponent(item.type)}
                >
                  <span className={styles.ic}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          ))}

          <div className={styles.emptyNote}>
            Tip: drag a component onto the template. Click it to edit properties.
          </div>
        </div>

        {/* Canvas */}
        <div className={styles.panelCanvas}>
          <div className={styles.page} style={{ transform: `scale(${zoom})` }}>
            <div className={styles.pageTitle}>Original</div>
            <div
              ref={gridRef}
              className={styles.certGrid}
              style={
                gridOn
                  ? {
                      backgroundImage:
                        "linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }
                  : undefined
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropOnCanvas}
              onMouseDown={(e) => {
                if (e.target === gridRef.current) setSelectedId(null);
              }}
            >
              {elements.map((el) => (
                <div
                  key={el.id}
                  className={`${styles.el} ${
                    el.id === selectedId ? styles.elSelected : ""
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
                    fontStyle: el.italic ? "italic" : "normal",
                    textDecoration: el.underline ? "underline" : "none",
                    justifyContent:
                      el.align === "left"
                        ? "flex-start"
                        : el.align === "right"
                        ? "flex-end"
                        : "center",
                    color: el.color,
                    background: el.bg,
                    border:
                      el.border === "none"
                        ? `1px solid ${
                            el.bg === PINK_BG ? PINK_BORDER : GREEN_BORDER
                          }`
                        : `1.5px ${el.border} ${el.borderColor}`,
                    padding: `${el.pad.t}px ${el.pad.r}px ${el.pad.b}px ${el.pad.l}px`,
                    whiteSpace: el.wrap ? "pre-wrap" : "nowrap",
                    outline: boundsOn ? "1px dotted #bbb" : undefined,
                  }}
                >
                  {el.text}
                  {el.subLabel && (
                    <div className={styles.subLabel}>{el.subLabel}</div>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.statusbar}>
              <span>Page 1 / 1</span>
              <span>Components: {elements.length}</span>
              <span>Selected: {selected ? selected.text : "none"}</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.panelRight}>
          <h2>Component properties</h2>
          {!selected ? (
            <div className={styles.noSel}>
              Select a component on the template to edit its position, size,
              typography and colors here.
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
  const fontFamilies = [
    "Helvetica",
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
  ];

  return (
    <div>
      <div className={styles.selInfo}>Field text</div>
      <div className={styles.selId}>ID &middot; {el.text}</div>

      <div className={`${styles.fieldRow} ${styles.twoCol}`}>
        <div>
          <label>X</label>
          <input
            type="number"
            value={el.x}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
        </div>
        <div>
          <label>Y</label>
          <input
            type="number"
            value={el.y}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className={`${styles.fieldRow} ${styles.twoCol}`}>
        <div>
          <label>Width</label>
          <input
            type="number"
            value={el.w}
            onChange={(e) => onChange({ w: Number(e.target.value) })}
          />
        </div>
        <div>
          <label>Height</label>
          <input
            type="number"
            value={el.h}
            onChange={(e) => onChange({ h: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className={`${styles.fieldRow} ${styles.twoCol}`}>
        <div>
          <label>Font size</label>
          <select
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
          <label>Leading</label>
          <select
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

      <div className={styles.fieldRow}>
        <label>Font family</label>
        <select
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

      <div className={styles.fieldRow}>
        <label>Font style</label>
        <div className={styles.seg}>
          <button
            className={el.bold ? styles.segActive : ""}
            onClick={() => onChange({ bold: !el.bold })}
          >
            <b>B</b>
          </button>
          <button
            className={el.italic ? styles.segActive : ""}
            onClick={() => onChange({ italic: !el.italic })}
          >
            <i>I</i>
          </button>
          <button
            className={el.underline ? styles.segActive : ""}
            onClick={() => onChange({ underline: !el.underline })}
          >
            <u>U</u>
          </button>
        </div>
      </div>

      <div className={`${styles.fieldRow} ${styles.twoCol}`}>
        <div>
          <label>Text align</label>
          <div className={styles.seg}>
            {(["left", "center", "right"] as Align[]).map((a) => (
              <button
                key={a}
                className={el.align === a ? styles.segActive : ""}
                onClick={() => onChange({ align: a })}
              >
                {a === "left" ? "\u2190" : a === "right" ? "\u2192" : "\u2194"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Vertical align</label>
          <div className={styles.seg}>
            {(["top", "middle", "bottom"] as VAlign[]).map((v) => (
              <button
                key={v}
                className={el.valign === v ? styles.segActive : ""}
                onClick={() => onChange({ valign: v })}
              >
                {v[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${styles.fieldRow} ${styles.twoCol}`}>
        <div>
          <label>Text color</label>
          <div className={styles.colorRow}>
            <input
              type="color"
              value={el.color}
              onChange={(e) => onChange({ color: e.target.value })}
            />
            <span>{el.color}</span>
          </div>
        </div>
        <div>
          <label>Background</label>
          <div className={styles.colorRow}>
            <input
              type="color"
              value={el.bg}
              onChange={(e) => onChange({ bg: e.target.value })}
            />
            <span>{el.bg}</span>
          </div>
        </div>
      </div>

      <div className={styles.checkRow}>
        <input
          type="checkbox"
          checked={el.wrap}
          onChange={(e) => onChange({ wrap: e.target.checked })}
        />
        Wrap text
      </div>
      <div className={styles.checkRow}>
        <input
          type="checkbox"
          checked={el.repeated}
          onChange={(e) => onChange({ repeated: e.target.checked })}
        />
        Repeated field
      </div>
      <div className={styles.checkRow}>
        <input
          type="checkbox"
          checked={el.readOnly}
          onChange={(e) => onChange({ readOnly: e.target.checked })}
        />
        Read only
      </div>

      <div className={styles.fieldRow}>
        <label>Border</label>
        <select
          value={el.border}
          onChange={(e) => onChange({ border: e.target.value as BorderStyle })}
        >
          <option value="none">None</option>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
        </select>
      </div>

      <div className={styles.fieldRow}>
        <label>Padding</label>
        <div className={styles.padGrid}>
          <div>
            <label>Top</label>
            <input
              type="number"
              value={el.pad.t}
              onChange={(e) => onChangePad({ t: Number(e.target.value) })}
            />
          </div>
          <div>
            <label>Right</label>
            <input
              type="number"
              value={el.pad.r}
              onChange={(e) => onChangePad({ r: Number(e.target.value) })}
            />
          </div>
          <div>
            <label>Bottom</label>
            <input
              type="number"
              value={el.pad.b}
              onChange={(e) => onChangePad({ b: Number(e.target.value) })}
            />
          </div>
          <div>
            <label>Left</label>
            <input
              type="number"
              value={el.pad.l}
              onChange={(e) => onChangePad({ l: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <button className={styles.btnDanger} onClick={onDelete}>
        Delete component
      </button>
    </div>
  );
}
