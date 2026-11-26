"use client";

import React, { useState } from "react";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Copy,
  Trash2,
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Minus,
  Triangle,
  Star,
  Edit2,
  Check,
} from "lucide-react";
import type { DesignElement, ShapeDesignElement } from "@/types/design-studio";

export interface LayersPanelProps {
  /** All elements on the active page */
  elements: DesignElement[];
  /** Currently selected element ID */
  selectedElementId: string | null;
  /** Select callback */
  onSelectElement: (id: string | null) => void;
  /** Rename layer callback */
  onRenameElement: (id: string, newName: string) => void;
  /** Toggle visibility callback */
  onToggleVisibility: (id: string, visible: boolean) => void;
  /** Toggle lock callback */
  onToggleLock: (id: string, locked: boolean) => void;
  /** Layer reorder direction callback */
  onReorderLayer: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
  /** Delete layer callback */
  onDeleteElement: (id: string) => void;
  /** Duplicate layer callback */
  onDuplicateElement: (id: string) => void;
  /** Optional container class name */
  className?: string;
}

function getElementIcon(el: DesignElement) {
  if (el.type === "text") return <Type className="w-3.5 h-3.5 text-brand-600" />;
  if (el.type === "image") return <ImageIcon className="w-3.5 h-3.5 text-purple-600" />;
  if (el.type === "shape") {
    const shape = (el as ShapeDesignElement).shapeType;
    if (shape === "circle" || shape === "ellipse") return <CircleIcon className="w-3.5 h-3.5 text-emerald-600" />;
    if (shape === "line" || shape === "divider") return <Minus className="w-3.5 h-3.5 text-slate-600" />;
    if (shape === "triangle") return <Triangle className="w-3.5 h-3.5 text-amber-600" />;
    if (shape === "star") return <Star className="w-3.5 h-3.5 text-amber-500" />;
    return <Square className="w-3.5 h-3.5 text-blue-600" />;
  }
  return <Layers className="w-3.5 h-3.5 text-surface-500" />;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onRenameElement,
  onToggleVisibility,
  onToggleLock,
  onReorderLayer,
  onDeleteElement,
  onDuplicateElement,
  className = "",
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // In standard design editors (Figma, Photoshop), layers are displayed top-to-bottom:
  // Top of the list = highest zIndex (rendered in front)
  // Bottom of the list = lowest zIndex (rendered at background)
  const displayLayers = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  const startRename = (el: DesignElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(el.id);
    setEditingName(el.name);
  };

  const commitRename = (id: string) => {
    if (editingName.trim()) {
      onRenameElement(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      className={`flex flex-col bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm text-surface-800 dark:text-surface-100 overflow-hidden ${className}`}
      data-testid="layers-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-850">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold">Layers ({elements.length})</span>
        </div>

        {/* Selected Layer Stacking Action Buttons */}
        {selectedElementId && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onReorderLayer(selectedElementId, "top")}
              className="p-1 rounded text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Bring to Front"
              data-testid="layer-bring-to-front"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onReorderLayer(selectedElementId, "up")}
              className="p-1 rounded text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Move Forward"
              data-testid="layer-move-up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onReorderLayer(selectedElementId, "down")}
              className="p-1 rounded text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Move Backward"
              data-testid="layer-move-down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onReorderLayer(selectedElementId, "bottom")}
              className="p-1 rounded text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Send to Back"
              data-testid="layer-send-to-back"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Layer Items List */}
      <div className="flex flex-col divide-y divide-surface-100 dark:divide-surface-800/60 max-h-[280px] overflow-y-auto">
        {displayLayers.length === 0 ? (
          <div className="p-4 text-center text-xs text-surface-400">
            No objects on this page yet. Use the tools above to add objects.
          </div>
        ) : (
          displayLayers.map((el) => {
            const isSelected = selectedElementId === el.id;

            return (
              <div
                key={el.id}
                onClick={() => {
                  if (!el.locked) {
                    onSelectElement(el.id);
                  }
                }}
                className={`group flex items-center justify-between px-2.5 py-1.5 text-xs transition-colors cursor-pointer select-none ${
                  isSelected
                    ? "bg-brand-50/80 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-medium"
                    : "hover:bg-surface-50 dark:hover:bg-surface-800/40"
                } ${!el.visible ? "opacity-50" : ""}`}
                data-testid={`layer-item-${el.id}`}
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getElementIcon(el)}

                  {editingId === el.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        autoFocus
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(el.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full px-1.5 py-0.5 text-xs border border-brand-500 rounded bg-white dark:bg-surface-800"
                        data-testid="layer-rename-input"
                      />
                      <button
                        type="button"
                        onClick={() => commitRename(el.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate flex-1" title={el.name}>
                      {el.name}
                    </span>
                  )}
                </div>

                {/* Right: Quick Actions (Visibility, Lock, Rename, Duplicate, Delete) */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 ml-2">
                  {editingId !== el.id && (
                    <button
                      type="button"
                      onClick={(e) => startRename(el, e)}
                      className="p-1 rounded text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                      title="Rename Layer"
                      data-testid={`layer-rename-btn-${el.id}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(el.id, !el.visible);
                    }}
                    className={`p-1 rounded transition-colors ${
                      el.visible
                        ? "text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                    title={el.visible ? "Hide layer" : "Show layer"}
                    data-testid={`layer-visibility-btn-${el.id}`}
                  >
                    {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(el.id, !el.locked);
                    }}
                    className={`p-1 rounded transition-colors ${
                      el.locked
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                    }`}
                    title={el.locked ? "Unlock layer" : "Lock layer"}
                    data-testid={`layer-lock-btn-${el.id}`}
                  >
                    {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateElement(el.id);
                    }}
                    className="p-1 rounded text-surface-400 hover:text-brand-600 transition-colors"
                    title="Duplicate layer"
                    data-testid={`layer-duplicate-btn-${el.id}`}
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(el.id);
                    }}
                    className="p-1 rounded text-surface-400 hover:text-red-600 transition-colors"
                    title="Delete layer"
                    data-testid={`layer-delete-btn-${el.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LayersPanel;
