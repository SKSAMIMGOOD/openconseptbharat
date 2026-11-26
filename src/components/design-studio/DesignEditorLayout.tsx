"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  DesignDocument,
  DesignPage,
  DesignElement,
  ElementTransform,
} from "@/types/design-studio";
import {
  updateElementInDocument,
  updateElementTransform,
  deleteElementFromDocument,
  duplicateElementInDocument,
  reorderElementLayer,
} from "@/lib/design-studio/template-foundation";
import { HistoryManager } from "@/lib/design-studio/history-manager";
import type { InMemoryAssetManager } from "@/lib/design-studio/asset-manager";
import { CanvasViewport } from "./CanvasViewport";
import { ObjectInsertionToolbar } from "./ObjectInsertionToolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayersPanel } from "./LayersPanel";
import { EditorNavigationToolbar } from "./EditorNavigationToolbar";
import { ExportPreviewModal } from "./ExportPreviewModal";
import { MultiCopyPrintSheetModal } from "./MultiCopyPrintSheetModal";

export interface DesignEditorLayoutProps {
  /** The design document state */
  initialDocument: DesignDocument;
  /** In-memory asset manager instance */
  assetManager?: InMemoryAssetManager;
  /** Document change callback */
  onDocumentChange?: (doc: DesignDocument) => void;
  /** Maximum number of undo states kept in history */
  maxHistoryLimit?: number;
  /** Optional callback to return to the template catalog */
  onBackToGallery?: () => void;
  /** Optional container class name */
  className?: string;
}

/**
 * Unified responsive workspace layout for Design Studio.
 * Integrates:
 * - Top navigation bar: Undo, Redo, Zoom controls, Document Title
 * - Left/Top side panel: Insertion tools & Layers management
 * - Center workspace: Interactive Konva canvas with auto-fit, wheel zoom & pan
 * - Right/Bottom side panel: Contextual Properties panel
 */
export const DesignEditorLayout: React.FC<DesignEditorLayoutProps> = ({
  initialDocument,
  assetManager,
  onDocumentChange,
  maxHistoryLimit = 50,
  onBackToGallery,
  className = "",
}) => {
  // 1. History Manager instance ref
  const historyRef = useRef<HistoryManager>(
    new HistoryManager(initialDocument, maxHistoryLimit)
  );

  const [doc, setDoc] = useState<DesignDocument>(initialDocument);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const [activePageId, setActivePageId] = useState<string>(
    initialDocument.pages[0]?.id || "page-1"
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showPrintSheetModal, setShowPrintSheetModal] = useState<boolean>(false);

  // Sync undo/redo availability state
  const syncHistoryState = useCallback(() => {
    if (historyRef.current) {
      setCanUndo(historyRef.current.canUndo());
      setCanRedo(historyRef.current.canRedo());
    }
  }, []);

  // Commit document change and register history entry
  const commitDocChange = useCallback(
    (newDoc: DesignDocument) => {
      setDoc(newDoc);
      historyRef.current.pushState(newDoc);
      syncHistoryState();
      onDocumentChange?.(newDoc);
    },
    [onDocumentChange, syncHistoryState]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    const prevDoc = historyRef.current.undo();
    if (prevDoc) {
      setDoc(prevDoc);
      syncHistoryState();
      onDocumentChange?.(prevDoc);
      // Validate whether current selectedElementId still exists in restored page
      const page = prevDoc.pages.find((p) => p.id === activePageId) || prevDoc.pages[0];
      if (selectedElementId && page && !page.elements.some((el) => el.id === selectedElementId)) {
        setSelectedElementId(null);
      }
    }
  }, [activePageId, onDocumentChange, selectedElementId, syncHistoryState]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    const nextDoc = historyRef.current.redo();
    if (nextDoc) {
      setDoc(nextDoc);
      syncHistoryState();
      onDocumentChange?.(nextDoc);
    }
  }, [onDocumentChange, syncHistoryState]);

  // 2. Global Keyboard Shortcuts: Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo), Delete / Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
        return;
      }

      const isMac = typeof navigator !== "undefined" && navigator.platform?.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if (
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z") ||
        (cmdOrCtrl && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        handleRedo();
      } else if (cmdOrCtrl && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setZoom((z) => Math.min(4.0, Number((z + 0.15).toFixed(2))));
      } else if (cmdOrCtrl && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        setZoom((z) => Math.max(0.2, Number((z - 0.15).toFixed(2))));
      } else if (cmdOrCtrl && e.key === "0") {
        e.preventDefault();
        setZoom(1.0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const activePage: DesignPage | undefined = useMemo(
    () => doc.pages.find((p) => p.id === activePageId) || doc.pages[0],
    [doc.pages, activePageId]
  );

  const selectedElement: DesignElement | null = useMemo(() => {
    if (!selectedElementId || !activePage) return null;
    return activePage.elements.find((el) => el.id === selectedElementId) || null;
  }, [activePage, selectedElementId]);

  // 3. Transform Updates from Canvas Stage (Committed on DragEnd / TransformEnd)
  const handleUpdateTransform = useCallback(
    (elementId: string, transform: Partial<ElementTransform>) => {
      const updated = updateElementTransform(doc, activePage.id, elementId, transform);
      commitDocChange(updated);
    },
    [doc, activePage?.id, commitDocChange]
  );

  // 4. Generic Element Property Updates
  const handleUpdateElement = useCallback(
    (elementId: string, updates: Partial<DesignElement>) => {
      const updated = updateElementInDocument(doc, activePage.id, elementId, updates);
      commitDocChange(updated);
    },
    [doc, activePage?.id, commitDocChange]
  );

  // 5. Delete Element
  const handleDeleteElement = useCallback(
    (elementId: string) => {
      const updated = deleteElementFromDocument(doc, activePage.id, elementId);
      commitDocChange(updated);
      if (selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [doc, activePage?.id, selectedElementId, commitDocChange]
  );

  // 6. Duplicate Element
  const handleDuplicateElement = useCallback(
    (elementId: string) => {
      const { document: updated, element } = duplicateElementInDocument(doc, activePage.id, elementId);
      commitDocChange(updated);
      if (element) {
        setSelectedElementId(element.id);
      }
    },
    [doc, activePage?.id, commitDocChange]
  );

  // 7. Layer Reorder
  const handleReorderLayer = useCallback(
    (elementId: string, direction: "up" | "down" | "top" | "bottom") => {
      const updated = reorderElementLayer(doc, activePage.id, elementId, direction);
      commitDocChange(updated);
    },
    [doc, activePage?.id, commitDocChange]
  );

  // 8. Layer Renaming
  const handleRenameElement = useCallback(
    (elementId: string, newName: string) => {
      handleUpdateElement(elementId, { name: newName });
    },
    [handleUpdateElement]
  );

  // 9. Layer Visibility Toggle
  const handleToggleVisibility = useCallback(
    (elementId: string, visible: boolean) => {
      handleUpdateElement(elementId, { visible });
      if (!visible && selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [handleUpdateElement, selectedElementId]
  );

  // 10. Layer Lock Toggle
  const handleToggleLock = useCallback(
    (elementId: string, locked: boolean) => {
      handleUpdateElement(elementId, { locked });
      if (locked && selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [handleUpdateElement, selectedElementId]
  );

  // 11. Mouse Wheel Zoom in Workspace Canvas
  const handleWorkspaceWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      setZoom((z) => Math.max(0.2, Math.min(4.0, Number((z + delta).toFixed(2)))));
    }
  }, []);

  return (
    <div
      className={`flex flex-col h-full min-h-[650px] w-full bg-surface-100 dark:bg-surface-950 text-surface-900 dark:text-surface-100 select-none overflow-hidden ${className}`}
      data-testid="design-editor-layout"
    >
      {/* 1. TOP NAVIGATION TOOLBAR: Undo, Redo, Zoom Controls */}
      <EditorNavigationToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(4.0, Number((z + 0.15).toFixed(2))))}
        onZoomOut={() => setZoom((z) => Math.max(0.2, Number((z - 0.15).toFixed(2))))}
        onZoomReset={() => setZoom(1.0)}
        onZoomFit={() => setZoom(1.0)} // 1.0 utilizes responsive auto-fit container bounds
        onBackToGallery={onBackToGallery}
        onExport={() => setShowExportModal(true)}
        onPrintMultiple={() => setShowPrintSheetModal(true)}
        documentTitle={doc.metadata.title}
      />

      {/* 2. MAIN WORKSPACE AREA: Sidebars + Center Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR: Tools & Layers Management */}
        <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-3 p-3 bg-white dark:bg-surface-900 border-b lg:border-b-0 lg:border-r border-surface-200 dark:border-surface-800 overflow-y-auto max-h-[400px] lg:max-h-full">
          {/* Object Insertion Toolbar */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider px-1">
              Insert Objects
            </span>
            <ObjectInsertionToolbar
              document={doc}
              activePageId={activePage.id}
              assetManager={assetManager}
              onDocumentChange={commitDocChange}
              onSelectElement={(id) => setSelectedElementId(id)}
            />
          </div>

          {/* Page Switcher (if multi-page) */}
          {doc.pages.length > 1 && (
            <div className="flex flex-col gap-1.5 border-t border-surface-100 dark:border-surface-800 pt-2.5">
              <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider px-1">
                Pages
              </span>
              <div className="flex items-center gap-1.5">
                {doc.pages.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePageId(p.id);
                      setSelectedElementId(null);
                    }}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded border transition-colors ${
                      p.id === activePage.id
                        ? "bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                        : "border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                    }`}
                  >
                    {p.name || `Page ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layers Management Panel */}
          <div className="flex flex-col gap-1.5 border-t border-surface-100 dark:border-surface-800 pt-2.5 flex-1">
            <LayersPanel
              elements={activePage.elements}
              selectedElementId={selectedElementId}
              onSelectElement={(id) => setSelectedElementId(id)}
              onRenameElement={handleRenameElement}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onReorderLayer={handleReorderLayer}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
            />
          </div>
        </aside>

        {/* CENTER WORKSPACE: Interactive Konva Canvas Viewport */}
        <main
          className="flex-1 flex flex-col relative min-w-0 bg-surface-100/80 dark:bg-surface-950 overflow-hidden"
          onWheel={handleWorkspaceWheel}
        >
          {/* Canvas Viewport */}
          <div className="flex-1 w-full h-full p-4 overflow-auto flex items-center justify-center">
            <CanvasViewport
              page={activePage}
              dimensions={doc.dimensions}
              orientation={doc.orientation}
              assets={doc.assets}
              zoom={zoom}
              selectedElementId={selectedElementId}
              onSelectElement={(id) => setSelectedElementId(id)}
              onUpdateElementTransform={handleUpdateTransform}
              onUpdateElementText={(id, newText) => handleUpdateElement(id, { text: newText })}
            />
          </div>
        </main>

        {/* RIGHT SIDEBAR: Contextual Properties Panel */}
        <aside className="w-full lg:w-72 flex-shrink-0 p-3 bg-white dark:bg-surface-900 border-t lg:border-t-0 lg:border-l border-surface-200 dark:border-surface-800 overflow-y-auto max-h-[350px] lg:max-h-full">
          <PropertiesPanel
            element={selectedElement}
            onUpdateElement={handleUpdateElement}
            onUpdateTransform={handleUpdateTransform}
            onDuplicateElement={handleDuplicateElement}
            onDeleteElement={handleDeleteElement}
          />
        </aside>
      </div>

      {/* 3. EXPORT PREVIEW MODAL */}
      <ExportPreviewModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        document={doc}
      />

      {/* 4. MULTI-COPY PRINT SHEET MODAL */}
      <MultiCopyPrintSheetModal
        isOpen={showPrintSheetModal}
        onClose={() => setShowPrintSheetModal(false)}
        document={doc}
      />
    </div>
  );
};

export default DesignEditorLayout;
