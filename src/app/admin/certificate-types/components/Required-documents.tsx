"use client";

import { useMemo, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Truck,
  Plane,
  Ship,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
  Plus,
  FileText,
  GripVertical,
  Check,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { apiFetch, getBaseUrl } from "@/utils/api";

type Accent = "emerald" | "sky" | "violet" | "amber" | "rose";

interface DocumentItem {
  id: string;
  name: string;
  required: boolean;
}

interface TransportMode {
  id: string;
  name: string;
  subtitle: string;
  icon: LucideIcon;
  accent: Accent;
  active: boolean;
  expanded: boolean;
  documents: DocumentItem[];
}

interface RequiredDocumentsProps {
  certificateType?: {
    id: string;
    code: string;
    name: string;
    requiredDocuments?: Record<string, string[]>;
  } | null;
  onTabChange?: (tabId: string) => void;
}

export interface RequiredDocumentsData {
  requiredDocuments: Record<string, string[]>;
}

export interface RequiredDocumentsRef {
  getData: () => RequiredDocumentsData;
}

const ACCENT_STYLES: Record<
  Accent,
  { border: string; iconBg: string; iconText: string }
> = {
  emerald: {
    border: "border-l-emerald-400",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
  },
  sky: {
    border: "border-l-sky-400",
    iconBg: "bg-sky-50",
    iconText: "text-sky-600",
  },
  violet: {
    border: "border-l-violet-400",
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
  },
  amber: {
    border: "border-l-amber-400",
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
  },
  rose: {
    border: "border-l-rose-400",
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
  },
};

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

const INITIAL_MODES: TransportMode[] = [
  {
    id: "land",
    name: "Land",
    subtitle: "Road Transport",
    icon: Truck,
    accent: "emerald",
    active: true,
    expanded: true,
    documents: [
      { id: nextId("doc"), name: "Invoice", required: true },
      { id: nextId("doc"), name: "Packing List", required: true },
    ],
  },
  {
    id: "air",
    name: "Air",
    subtitle: "Air Transport",
    icon: Plane,
    accent: "sky",
    active: true,
    expanded: true,
    documents: [
      { id: nextId("doc"), name: "Airway Bill", required: true },
      { id: nextId("doc"), name: "Invoice", required: true },
      { id: nextId("doc"), name: "Packing List", required: true },
    ],
  },
  {
    id: "sea",
    name: "Sea",
    subtitle: "Sea Transport",
    icon: Ship,
    accent: "violet",
    active: true,
    expanded: true,
    documents: [
      { id: nextId("doc"), name: "Bill of Lading", required: true },
      { id: nextId("doc"), name: "Invoice", required: true },
      { id: nextId("doc"), name: "Packing List", required: true },
    ],
  },
];

const RequiredDocumentsPanel = forwardRef<RequiredDocumentsRef, RequiredDocumentsProps>(({ certificateType, onTabChange }, ref) => {
  const [modes, setModes] = useState<TransportMode[]>(INITIAL_MODES);
  const [editingDoc, setEditingDoc] = useState<{ modeId: string; docId: string } | null>(null);
  const [draftName, setDraftName] = useState("");
  const [addingModeOpen, setAddingModeOpen] = useState(false);
  const [newModeName, setNewModeName] = useState("");
  const [dragState, setDragState] = useState<{ modeId: string; docId: string } | null>(null);

  // Fetch required documents from API
  useEffect(() => {
    const fetchRequiredDocuments = async () => {
      if (!certificateType?.id) return;

      try {
        const baseUrl = getBaseUrl();
        const response = await apiFetch(`${baseUrl}/api/v1/admin/certificate-types/${certificateType.id}`);
        const data = await response.json();

        if (data.success && data.data?.requiredDocuments) {
          const apiDocs = data.data.requiredDocuments;
          
          // Convert API response to TransportMode format
          const transportModes: TransportMode[] = Object.entries(apiDocs).map(([key, docs]) => {
            const modeKey = key.toLowerCase();
            let icon: LucideIcon = Truck;
            let accent: Accent = "emerald";
            let subtitle = "Road Transport";

            if (modeKey === "air") {
              icon = Plane;
              accent = "sky";
              subtitle = "Air Transport";
            } else if (modeKey === "sea") {
              icon = Ship;
              accent = "violet";
              subtitle = "Sea Transport";
            }

            return {
              id: modeKey,
              name: key.charAt(0) + key.slice(1).toLowerCase(),
              subtitle,
              icon,
              accent,
              active: true,
              expanded: true,
              documents: (docs as string[]).map((docName) => ({
                id: nextId("doc"),
                name: docName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                required: true,
              })),
            };
          });

          setModes(transportModes);
        }
      } catch (error) {
        console.error('Failed to fetch required documents:', error);
        // Keep using initial modes as fallback
      }
    };

    fetchRequiredDocuments();
  }, [certificateType?.id]);

  // Expose data via ref
  useImperativeHandle(ref, () => ({
    getData: () => {
      // Convert TransportMode format to API format
      const requiredDocuments: Record<string, string[]> = {};
      modes.forEach((mode) => {
        if (mode.active && mode.documents.length > 0) {
          requiredDocuments[mode.id.toUpperCase()] = mode.documents.map((doc) =>
            doc.name.toUpperCase().replace(/\s+/g, '_')
          );
        }
      });
      return { requiredDocuments };
    },
  }));

  const totalDocuments = useMemo(
    () => modes.reduce((sum, m) => sum + m.documents.length, 0),
    [modes]
  );

  const toggleExpanded = (modeId: string) =>
    setModes((prev) =>
      prev.map((m) => (m.id === modeId ? { ...m, expanded: !m.expanded } : m))
    );

  const deleteMode = (modeId: string) =>
    setModes((prev) => prev.filter((m) => m.id !== modeId));

  const addDocument = (modeId: string) =>
    setModes((prev) =>
      prev.map((m) =>
        m.id === modeId
          ? {
              ...m,
              documents: [
                ...m.documents,
                { id: nextId("doc"), name: "New Document", required: true },
              ],
            }
          : m
      )
    );

  const deleteDocument = (modeId: string, docId: string) =>
    setModes((prev) =>
      prev.map((m) =>
        m.id === modeId
          ? { ...m, documents: m.documents.filter((d) => d.id !== docId) }
          : m
      )
    );

  const startEdit = (modeId: string, doc: DocumentItem) => {
    setEditingDoc({ modeId, docId: doc.id });
    setDraftName(doc.name);
  };

  const commitEdit = () => {
    if (!editingDoc) return;
    const { modeId, docId } = editingDoc;
    setModes((prev) =>
      prev.map((m) =>
        m.id === modeId
          ? {
              ...m,
              documents: m.documents.map((d) =>
                d.id === docId
                  ? { ...d, name: draftName.trim() || d.name }
                  : d
              ),
            }
          : m
      )
    );
    setEditingDoc(null);
    setDraftName("");
  };

  const cancelEdit = () => {
    setEditingDoc(null);
    setDraftName("");
  };

  const reorder = (modeId: string, fromId: string, toId: string) => {
    if (fromId === toId) return;
    setModes((prev) =>
      prev.map((m) => {
        if (m.id !== modeId) return m;
        const docs = [...m.documents];
        const fromIdx = docs.findIndex((d) => d.id === fromId);
        const toIdx = docs.findIndex((d) => d.id === toId);
        if (fromIdx === -1 || toIdx === -1) return m;
        const [moved] = docs.splice(fromIdx, 1);
        docs.splice(toIdx, 0, moved);
        return { ...m, documents: docs };
      })
    );
  };

  const addMode = () => {
    const name = newModeName.trim();
    if (!name) return;
    const accents: Accent[] = ["amber", "rose", "sky", "emerald", "violet"];
    setModes((prev) => [
      ...prev,
      {
        id: nextId("mode"),
        name,
        subtitle: `${name} Transport`,
        icon: FileText,
        accent: accents[prev.length % accents.length],
        active: true,
        expanded: true,
        documents: [],
      },
    ]);
    setNewModeName("");
    setAddingModeOpen(false);
  };

  return (
    <div className="h-full flex flex-col text-slate-900">
      <div className="rounded border border-[#e2e8f0] bg-white p-6 shadow-lg flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#1a4a8a]">
              Required Documents
            </h2>
            <p className="mt-1 text-[13px] text-[#64748b]">
              Configure mandatory documents based on Mode of Transport (FR-54).
              Applicants must upload all required documents for the selected
              mode.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddingModeOpen((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#1a4a8a] bg-[#e8f0fe] px-2 py-2 text-[13px] font-medium text-[#1a4a8a] hover:bg-[#d4e6fd] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Transport Mode
          </button>
        </div>

        {addingModeOpen && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3">
            <input
              autoFocus
              type="text"
              value={newModeName}
              onChange={(e) => setNewModeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMode()}
              placeholder="e.g. Rail"
              className="flex-1 rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm outline-none focus:border-[#1a4a8a] focus:ring-2 focus:ring-[#1a4a8a]/20"
            />
            <button
              type="button"
              onClick={addMode}
              className="rounded-lg bg-[#1a4a8a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2a5a9a] transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingModeOpen(false);
                setNewModeName("");
              }}
              className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Transport mode groups */}
        <div className="flex-1 space-y-5 overflow-auto">
          {modes.map((mode) => (
            <TransportModeCard
              key={mode.id}
              mode={mode}
              onToggleExpanded={() => toggleExpanded(mode.id)}
              onDeleteMode={() => deleteMode(mode.id)}
              onAddDocument={() => addDocument(mode.id)}
              onDeleteDocument={(docId) => deleteDocument(mode.id, docId)}
              onStartEdit={(doc) => startEdit(mode.id, doc)}
              editingDocId={
                editingDoc?.modeId === mode.id ? editingDoc.docId : null
              }
              draftName={draftName}
              setDraftName={setDraftName}
              onCommitEdit={commitEdit}
              onCancelEdit={cancelEdit}
              dragDocId={dragState?.modeId === mode.id ? dragState.docId : null}
              onDragStart={(docId) => setDragState({ modeId: mode.id, docId })}
              onDragEnd={() => setDragState(null)}
              onDropOn={(toId) => {
                if (dragState) reorder(mode.id, dragState.docId, toId);
              }}
            />
          ))}

          {modes.length === 0 && (
            <p className="rounded-lg border border-dashed border-[#cbd5e1] py-8 text-center text-sm text-[#94a3b8]">
              No transport modes configured. Add one to get started.
            </p>
          )}
        </div>

        {/* Info banner */}
        <div className="mt-6 flex gap-3 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1a4a8a]" />
          <div className="space-y-1 text-[12px] text-[#1e3a5f]">
            <p>
              Applicants will be required to upload all documents marked as
              &ldquo;Required&rdquo; for the selected mode of transport.
            </p>
            <p>You can reorder documents using the drag handle.</p>
          </div>
        </div>
      </div>

      {/* Footer / pagination */}
      <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-4 py-6 text-sm text-[#64748b]">
          <span>Page 1 of 1</span>
          <span className="text-[#cbd5e1]">|</span>
          <span>Transport Modes: {modes.length}</span>
          <span className="text-[#cbd5e1]">|</span>
          <span>Total Documents: {totalDocuments}</span>
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
            onClick={() => onTabChange?.('template-designer')}
            className="flex items-center gap-1 rounded-lg bg-[#1a4a8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a5a9a] transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

RequiredDocumentsPanel.displayName = 'RequiredDocumentsPanel';

export default RequiredDocumentsPanel;

function TransportModeCard({
  mode,
  onToggleExpanded,
  onDeleteMode,
  onAddDocument,
  onDeleteDocument,
  onStartEdit,
  editingDocId,
  draftName,
  setDraftName,
  onCommitEdit,
  onCancelEdit,
  dragDocId,
  onDragStart,
  onDragEnd,
  onDropOn,
}: {
  mode: TransportMode;
  onToggleExpanded: () => void;
  onDeleteMode: () => void;
  onAddDocument: () => void;
  onDeleteDocument: (docId: string) => void;
  onStartEdit: (doc: DocumentItem) => void;
  editingDocId: string | null;
  draftName: string;
  setDraftName: (v: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  dragDocId: string | null;
  onDragStart: (docId: string) => void;
  onDragEnd: () => void;
  onDropOn: (docId: string) => void;
}) {
  const Icon = mode.icon;
  const styles = ACCENT_STYLES[mode.accent];

  return (
    <div
      className={`overflow-hidden rounded-lg border border-[#e2e8f0] border-l-4 ${styles.border}`}
    >
      <div className="flex flex-wrap items-center gap-4 border-b border-[#e2e8f0] p-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${styles.iconText}`} />
        </div>
        <div className="min-w-[120px]">
          <p className="font-semibold text-[#1e293b]">{mode.name}</p>
          <p className="text-sm text-[#64748b]">{mode.subtitle}</p>
        </div>

        <p className="ml-2 text-sm font-semibold text-[#64748b]">
          Required Documents
        </p>

        <div className="ml-auto flex items-center gap-3">
          {mode.active && (
            <span className="rounded bg-[#dcfce7] border border-[#86efac] px-2.5 py-1 text-xs font-semibold text-[#166534]">
              Active
            </span>
          )}
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-label={mode.expanded ? "Collapse" : "Expand"}
            className="rounded-md p-1.5 text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#475569] transition-colors"
          >
            {mode.expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onDeleteMode}
            aria-label={`Delete ${mode.name}`}
            className="rounded-md border border-[#fecaca] p-1.5 text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mode.expanded && (
        <div className="flex flex-wrap items-center gap-3 p-4">
          {mode.documents.map((doc) => (
            <div
              key={doc.id}
              draggable
              onDragStart={() => onDragStart(doc.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropOn(doc.id)}
              className={`flex items-center gap-2 rounded-lg border border-[#e2e8f0] px-3 py-2 transition-opacity ${
                dragDocId === doc.id ? "opacity-40" : "opacity-100"
              }`}
            >
              <GripVertical className="h-4 w-4 cursor-grab text-[#cbd5e1] active:cursor-grabbing" />
              <FileText className="h-4 w-4 text-[#94a3b8]" />

              {editingDocId === doc.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onCommitEdit();
                    if (e.key === "Escape") onCancelEdit();
                  }}
                  className="w-32 rounded border border-[#1a4a8a] px-1.5 py-0.5 text-sm outline-none focus:ring-2 focus:ring-[#1a4a8a]/20"
                />
              ) : (
                <span className="text-sm text-[#334155] font-medium">{doc.name}</span>
              )}

              {doc.required && (
                <span className="rounded-full bg-[#e8f0fe] border border-[#bfdbfe] px-2 py-0.5 text-[10px] font-semibold text-[#1a4a8a]">
                  Required
                </span>
              )}

              {editingDocId === doc.id ? (
                <>
                  <button
                    type="button"
                    onClick={onCommitEdit}
                    aria-label="Save"
                    className="rounded p-1 text-[#16a34a] hover:bg-[#dcfce7] transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    aria-label="Cancel"
                    className="rounded p-1 text-[#94a3b8] hover:bg-[#f1f5f9] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onStartEdit(doc)}
                    aria-label={`Edit ${doc.name}`}
                    className="rounded p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDocument(doc.id)}
                    aria-label={`Delete ${doc.name}`}
                    className="rounded p-1 text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={onAddDocument}
            className="flex items-center gap-1.5 rounded-lg border border-[#1a4a8a] bg-[#e8f0fe] px-3.5 py-2 text-sm font-semibold text-[#1a4a8a] hover:bg-[#d4e6fd] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Document
          </button>
        </div>
      )}
    </div>
  );
}