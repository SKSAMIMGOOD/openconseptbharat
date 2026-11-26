"use client";

import React from "react";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Sliders,
} from "lucide-react";
import type {
  DesignElement,
  TextDesignElement,
  ImageDesignElement,
  ShapeDesignElement,
  ElementTransform,
} from "@/types/design-studio";

export interface PropertiesPanelProps {
  /** The currently selected element, or null */
  element: DesignElement | null;
  /** Update callback for arbitrary element properties */
  onUpdateElement: (elementId: string, updates: Partial<DesignElement>) => void;
  /** Update callback for transform properties */
  onUpdateTransform: (elementId: string, transform: Partial<ElementTransform>) => void;
  /** Duplicate element callback */
  onDuplicateElement: (elementId: string) => void;
  /** Delete element callback */
  onDeleteElement: (elementId: string) => void;
  /** Optional container class name */
  className?: string;
}

const COMMON_FONTS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "Open Sans",
  "Lato",
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  onUpdateElement,
  onUpdateTransform,
  onDuplicateElement,
  onDeleteElement,
  className = "",
}) => {
  if (!element) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center text-surface-400 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg min-h-[220px] ${className}`}
        data-testid="properties-empty-state"
      >
        <Sliders className="w-8 h-8 mb-2 text-surface-300 dark:text-surface-700" />
        <p className="text-xs font-medium">No object selected</p>
        <p className="text-[11px] text-surface-400 mt-1">
          Select an object on the canvas or layers list to customize its properties.
        </p>
      </div>
    );
  }

  const { transform, locked } = element;

  return (
    <div
      className={`flex flex-col gap-4 p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm text-surface-800 dark:text-surface-100 ${className}`}
      data-testid="properties-panel"
    >
      {/* Header: Object Type & Actions */}
      <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold capitalize">{element.type} Properties</span>
          {locked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateElement(element.id, { locked: !locked })}
            className={`p-1 rounded transition-colors ${
              locked ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40" : "text-surface-400 hover:text-surface-700"
            }`}
            title={locked ? "Unlock element" : "Lock element"}
            data-testid="prop-lock-btn"
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onDuplicateElement(element.id)}
            className="p-1 rounded text-surface-400 hover:text-brand-600 transition-colors"
            title="Duplicate object"
            data-testid="prop-duplicate-btn"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteElement(element.id)}
            className="p-1 rounded text-surface-400 hover:text-red-600 transition-colors"
            title="Delete object"
            data-testid="prop-delete-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Text-Specific Properties */}
      {element.type === "text" && (
        <div className="flex flex-col gap-3 text-xs" data-testid="text-properties">
          {/* Text Content */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-surface-500">Text Content</label>
            <textarea
              value={(element as TextDesignElement).text}
              disabled={locked}
              onChange={(e) => onUpdateElement(element.id, { text: e.target.value })}
              rows={2}
              className="w-full px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs resize-y"
              data-testid="prop-text-content"
            />
          </div>

          {/* Typography: Font Family & Size */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-surface-500">Font</label>
              <select
                value={(element as TextDesignElement).fontFamily}
                disabled={locked}
                onChange={(e) => onUpdateElement(element.id, { fontFamily: e.target.value })}
                className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
                data-testid="prop-font-family"
              >
                {COMMON_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-surface-500">Size (pt)</label>
              <input
                type="number"
                min={6}
                max={200}
                value={(element as TextDesignElement).fontSize}
                disabled={locked}
                onChange={(e) => {
                  const val = Math.max(6, Math.min(200, Number(e.target.value) || 12));
                  onUpdateElement(element.id, { fontSize: val });
                }}
                className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
                data-testid="prop-font-size"
              />
            </div>
          </div>

          {/* Formatting: Bold, Italic, Alignment, Color */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <div className="flex items-center gap-1 border border-surface-200 dark:border-surface-700 rounded p-0.5">
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  const currentBold = (element as TextDesignElement).fontWeight === "bold";
                  onUpdateElement(element.id, { fontWeight: currentBold ? "normal" : "bold" });
                }}
                className={`p-1 rounded ${
                  (element as TextDesignElement).fontWeight === "bold"
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-950/50"
                    : "text-surface-500 hover:text-surface-800"
                }`}
                title="Bold"
                data-testid="prop-bold-btn"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  const currentItalic = (element as TextDesignElement).fontStyle === "italic";
                  onUpdateElement(element.id, { fontStyle: currentItalic ? "normal" : "italic" });
                }}
                className={`p-1 rounded ${
                  (element as TextDesignElement).fontStyle === "italic"
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-950/50"
                    : "text-surface-500 hover:text-surface-800"
                }`}
                title="Italic"
                data-testid="prop-italic-btn"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignments */}
            <div className="flex items-center gap-1 border border-surface-200 dark:border-surface-700 rounded p-0.5">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  disabled={locked}
                  onClick={() => onUpdateElement(element.id, { align })}
                  className={`p-1 rounded ${
                    (element as TextDesignElement).align === align
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-950/50"
                      : "text-surface-500 hover:text-surface-800"
                  }`}
                  title={`Align ${align}`}
                >
                  {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                  {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                  {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            {/* Text Color Input */}
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={(element as TextDesignElement).fill}
                disabled={locked}
                onChange={(e) => onUpdateElement(element.id, { fill: e.target.value })}
                className="w-7 h-7 p-0 border border-surface-300 rounded cursor-pointer disabled:opacity-50"
                title="Text color"
                data-testid="prop-text-color"
              />
            </div>
          </div>

          {/* Line Height & Letter Spacing */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-surface-500">Line Height</label>
              <input
                type="number"
                step="0.1"
                min="0.8"
                max="3.0"
                value={(element as TextDesignElement).lineHeight || 1.3}
                disabled={locked}
                onChange={(e) => {
                  const val = Math.max(0.8, Math.min(3.0, Number(e.target.value) || 1.3));
                  onUpdateElement(element.id, { lineHeight: val });
                }}
                className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-surface-500">Letter Spacing</label>
              <input
                type="number"
                step="0.5"
                min="-5"
                max="20"
                value={(element as TextDesignElement).letterSpacing || 0}
                disabled={locked}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  onUpdateElement(element.id, { letterSpacing: val });
                }}
                className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Shape-Specific Properties */}
      {element.type === "shape" && (
        <div className="flex flex-col gap-3 text-xs" data-testid="shape-properties">
          <div className="grid grid-cols-2 gap-2">
            {/* Fill Color */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-surface-500">Fill Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(element as ShapeDesignElement).fill === "transparent" ? "#ffffff" : (element as ShapeDesignElement).fill}
                  disabled={locked}
                  onChange={(e) => onUpdateElement(element.id, { fill: e.target.value })}
                  className="w-7 h-7 p-0 border border-surface-300 rounded cursor-pointer disabled:opacity-50"
                  data-testid="prop-shape-fill"
                />
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onUpdateElement(element.id, { fill: "transparent" })}
                  className="text-[10px] text-surface-400 hover:text-surface-700 underline"
                >
                  None
                </button>
              </div>
            </div>

            {/* Stroke Color */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-surface-500">Stroke Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(element as ShapeDesignElement).stroke === "transparent" ? "#000000" : (element as ShapeDesignElement).stroke}
                  disabled={locked}
                  onChange={(e) => onUpdateElement(element.id, { stroke: e.target.value })}
                  className="w-7 h-7 p-0 border border-surface-300 rounded cursor-pointer disabled:opacity-50"
                  data-testid="prop-shape-stroke"
                />
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onUpdateElement(element.id, { stroke: "transparent" })}
                  className="text-[10px] text-surface-400 hover:text-surface-700 underline"
                >
                  None
                </button>
              </div>
            </div>
          </div>

          {/* Stroke Width */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-surface-500">
              <span>Stroke Width</span>
              <span>{(element as ShapeDesignElement).strokeWidth} px</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={(element as ShapeDesignElement).strokeWidth}
              disabled={locked}
              onChange={(e) => onUpdateElement(element.id, { strokeWidth: Number(e.target.value) })}
              className="w-full accent-brand-600"
              data-testid="prop-stroke-width"
            />
          </div>
        </div>
      )}

      {/* 3. Image-Specific Properties */}
      {element.type === "image" && (
        <div className="flex flex-col gap-3 text-xs" data-testid="image-properties">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-surface-500">Image Fit</label>
            <select
              value={(element as ImageDesignElement).fit || "contain"}
              disabled={locked}
              onChange={(e) => onUpdateElement(element.id, { fit: e.target.value as "contain" | "cover" | "fill" })}
              className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
              data-testid="prop-image-fit"
            >
              <option value="contain">Contain (Fit Whole Image)</option>
              <option value="cover">Cover (Fill Without Distortion)</option>
              <option value="fill">Fill (Stretch to Bounds)</option>
            </select>
          </div>
        </div>
      )}

      {/* 4. Common Spatial Properties: Position, Size, Rotation, Opacity */}
      <div className="flex flex-col gap-3 border-t border-surface-100 dark:border-surface-800 pt-3 text-xs">
        <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Geometry & Transform</span>

        {/* X and Y */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-surface-500">X Position (pt)</label>
            <input
              type="number"
              value={Math.round(transform.x)}
              disabled={locked}
              onChange={(e) => onUpdateTransform(element.id, { x: Number(e.target.value) || 0 })}
              className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
              data-testid="prop-pos-x"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-surface-500">Y Position (pt)</label>
            <input
              type="number"
              value={Math.round(transform.y)}
              disabled={locked}
              onChange={(e) => onUpdateTransform(element.id, { y: Number(e.target.value) || 0 })}
              className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
              data-testid="prop-pos-y"
            />
          </div>
        </div>

        {/* Width and Height */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-surface-500">Width (pt)</label>
            <input
              type="number"
              min={5}
              value={Math.round(transform.width)}
              disabled={locked}
              onChange={(e) => {
                const val = Math.max(5, Number(e.target.value) || 5);
                onUpdateTransform(element.id, { width: val });
              }}
              className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
              data-testid="prop-width"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-surface-500">Height (pt)</label>
            <input
              type="number"
              min={5}
              value={Math.round(transform.height)}
              disabled={locked}
              onChange={(e) => {
                const val = Math.max(5, Number(e.target.value) || 5);
                onUpdateTransform(element.id, { height: val });
              }}
              className="px-2 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 disabled:opacity-50 text-xs"
              data-testid="prop-height"
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-surface-500">
            <span>Rotation</span>
            <span>{transform.rotation}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={transform.rotation}
            disabled={locked}
            onChange={(e) => onUpdateTransform(element.id, { rotation: Number(e.target.value) })}
            className="w-full accent-brand-600"
            data-testid="prop-rotation"
          />
        </div>

        {/* Opacity */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-surface-500">
            <span>Opacity</span>
            <span>{Math.round(element.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(element.opacity * 100)}
            disabled={locked}
            onChange={(e) => onUpdateElement(element.id, { opacity: Number(e.target.value) / 100 })}
            className="w-full accent-brand-600"
            data-testid="prop-opacity"
          />
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
