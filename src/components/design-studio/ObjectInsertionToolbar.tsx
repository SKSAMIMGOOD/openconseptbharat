"use client";

import React, { useRef, useState } from "react";
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Minus,
  Triangle as TriangleIcon,
  Upload,
} from "lucide-react";
import type {
  DesignDocument,
  DesignPage,
  DesignAsset,
  ShapeGeometry,
} from "@/types/design-studio";
import {
  insertTextElement,
  insertShapeElement,
  insertImageElement,
  calculateCenteredPosition,
} from "@/lib/design-studio/template-foundation";
import { getPageDimensionsPt } from "@/lib/design-studio/coordinate-converter";
import type { InMemoryAssetManager } from "@/lib/design-studio/asset-manager";

export interface ObjectInsertionToolbarProps {
  /** The currently active design document */
  document: DesignDocument;
  /** Currently active page ID */
  activePageId: string;
  /** Document asset manager instance */
  assetManager?: InMemoryAssetManager;
  /** Callback fired when document is updated after object insertion */
  onDocumentChange: (updatedDoc: DesignDocument) => void;
  /** Callback fired to select newly inserted element */
  onSelectElement?: (elementId: string) => void;
  /** Optional container class name */
  className?: string;
}

/**
 * Accessible, lightweight object insertion toolbar for Design Studio.
 * Allows one-click insertion of Text, Shapes, and Image Uploads placed
 * at the center of the active page.
 */
export const ObjectInsertionToolbar: React.FC<ObjectInsertionToolbarProps> = ({
  document: doc,
  activePageId,
  assetManager,
  onDocumentChange,
  onSelectElement,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activePage: DesignPage | undefined = doc.pages.find((p) => p.id === activePageId) || doc.pages[0];
  const { widthPt, heightPt } = getPageDimensionsPt(doc.dimensions, doc.orientation);

  // 1. Insert Text Tool
  const handleInsertText = () => {
    if (!activePage) return;
    const defaultWidth = 180;
    const defaultHeight = 40;
    const center = calculateCenteredPosition(widthPt, heightPt, defaultWidth, defaultHeight);

    const { document: updatedDoc, element } = insertTextElement(doc, activePage.id, {
      text: "Heading Text",
      fontFamily: "Inter",
      fontSize: 18,
      fontWeight: "bold",
      fill: "#111827",
      transform: {
        x: center.x,
        y: center.y,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
    });

    onDocumentChange(updatedDoc);
    onSelectElement?.(element.id);
  };

  // 2. Insert Shape Tool
  const handleInsertShape = (shapeType: ShapeGeometry) => {
    if (!activePage) return;

    let defaultWidth = 100;
    let defaultHeight = 80;

    if (shapeType === "circle") {
      defaultWidth = 90;
      defaultHeight = 90;
    } else if (shapeType === "line" || shapeType === "divider") {
      defaultWidth = Math.min(200, Math.round(widthPt * 0.7));
      defaultHeight = 2;
    } else if (shapeType === "triangle") {
      defaultWidth = 90;
      defaultHeight = 80;
    }

    const center = calculateCenteredPosition(widthPt, heightPt, defaultWidth, defaultHeight);

    const { document: updatedDoc, element } = insertShapeElement(doc, activePage.id, {
      shapeType,
      fill: shapeType === "line" || shapeType === "divider" ? "transparent" : "#2563eb",
      stroke: shapeType === "line" || shapeType === "divider" ? "#2563eb" : "transparent",
      strokeWidth: shapeType === "line" || shapeType === "divider" ? 2 : 0,
      transform: {
        x: center.x,
        y: center.y,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
    });

    onDocumentChange(updatedDoc);
    onSelectElement?.(element.id);
  };

  // 3. Image Upload Tool
  const handleImageUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePage) return;

    // Reset input so re-selecting same file fires change
    e.target.value = "";

    try {
      setIsUploading(true);
      setUploadError(null);

      // Validate format
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Unsupported format. Please select a PNG, JPG, or WebP image.");
      }

      // Max size: 25MB
      if (file.size > 25 * 1024 * 1024) {
        throw new Error("Image file exceeds maximum limit of 25MB.");
      }

      let asset: DesignAsset;
      if (assetManager) {
        asset = await assetManager.ingestImageFile(file);
      } else {
        // Fallback in-memory Object URL creation
        const url = URL.createObjectURL(file);
        const assetId = `asset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        asset = {
          id: assetId,
          name: file.name,
          type: "image",
          mimeType: file.type,
          url,
          width: 800,
          height: 600,
          sizeBytes: file.size,
        };
      }

      // Calculate initial dimensions that preserve aspect ratio without overflowing page
      const naturalW = asset.width || 800;
      const naturalH = asset.height || 600;
      const aspectRatio = naturalW / naturalH;

      // Max initial size: 50% of page dimension
      const maxTargetWidth = Math.round(widthPt * 0.5);
      const maxTargetHeight = Math.round(heightPt * 0.5);

      let targetWidth = maxTargetWidth;
      let targetHeight = Math.round(targetWidth / aspectRatio);

      if (targetHeight > maxTargetHeight) {
        targetHeight = maxTargetHeight;
        targetWidth = Math.round(targetHeight * aspectRatio);
      }

      targetWidth = Math.max(30, targetWidth);
      targetHeight = Math.max(30, targetHeight);

      const center = calculateCenteredPosition(widthPt, heightPt, targetWidth, targetHeight);

      // Register asset in document assets dictionary
      const docWithAsset: DesignDocument = {
        ...doc,
        assets: {
          ...doc.assets,
          [asset.id]: asset,
        },
      };

      const { document: updatedDoc, element } = insertImageElement(
        docWithAsset,
        activePage.id,
        asset.id,
        {
          name: file.name,
          fit: "contain",
          transform: {
            x: center.x,
            y: center.y,
            width: targetWidth,
            height: targetHeight,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
        }
      );

      onDocumentChange(updatedDoc);
      onSelectElement?.(element.id);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to import image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-sm text-surface-700 dark:text-surface-200 ${className}`}
      role="toolbar"
      aria-label="Design Studio object insertion tools"
    >
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
        data-testid="image-upload-input"
      />

      {/* 1. Text Button */}
      <button
        type="button"
        onClick={handleInsertText}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded hover:bg-surface-100 dark:hover:bg-surface-800 active:bg-surface-200 transition-colors"
        title="Add Text"
        data-testid="insert-text-btn"
      >
        <Type className="w-3.5 h-3.5 text-brand-600" />
        <span>Text</span>
      </button>

      <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-0.5" />

      {/* 2. Shape Buttons */}
      <button
        type="button"
        onClick={() => handleInsertShape("rect")}
        className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 active:bg-surface-200 transition-colors"
        title="Add Rectangle"
        data-testid="insert-rect-btn"
      >
        <Square className="w-3.5 h-3.5 text-blue-600" />
      </button>

      <button
        type="button"
        onClick={() => handleInsertShape("circle")}
        className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 active:bg-surface-200 transition-colors"
        title="Add Circle"
        data-testid="insert-circle-btn"
      >
        <CircleIcon className="w-3.5 h-3.5 text-emerald-600" />
      </button>

      <button
        type="button"
        onClick={() => handleInsertShape("line")}
        className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 active:bg-surface-200 transition-colors"
        title="Add Line"
        data-testid="insert-line-btn"
      >
        <Minus className="w-3.5 h-3.5 text-slate-600" />
      </button>

      <button
        type="button"
        onClick={() => handleInsertShape("triangle")}
        className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 active:bg-surface-200 transition-colors"
        title="Add Triangle"
        data-testid="insert-triangle-btn"
      >
        <TriangleIcon className="w-3.5 h-3.5 text-amber-600" />
      </button>

      <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-0.5" />

      {/* 3. Image Upload Button */}
      <button
        type="button"
        onClick={handleImageUploadClick}
        disabled={isUploading}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded hover:bg-surface-100 dark:hover:bg-surface-800 active:bg-surface-200 disabled:opacity-50 transition-colors"
        title="Upload Image (PNG, JPG, WebP)"
        data-testid="insert-image-btn"
      >
        {isUploading ? (
          <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5 text-purple-600" />
        )}
        <span>{isUploading ? "Uploading..." : "Upload Image"}</span>
      </button>

      {/* Error notification banner */}
      {uploadError && (
        <span className="text-[11px] text-red-600 dark:text-red-400 font-medium pl-1 animate-fadeIn">
          {uploadError}
        </span>
      )}
    </div>
  );
};

export default ObjectInsertionToolbar;
