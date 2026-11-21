/**
 * Document Straightener — useDocumentStraightener Hook
 *
 * Implements the state machine and processing lifecycle for Document Straightener:
 * - Independent Front and Back side photograph handling
 * - Preserves 4-corner crop coordinates across side switches and re-edits
 * - High-resolution 100% in-browser perspective warping
 * - Integrates Document Studio enhancements, print dimensions, borders, and PDF export
 * - Strict ephemeral memory management: 0 bytes uploaded to servers, all Object URLs revoked on cleanup
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  Point2D,
  PerspectiveQuad,
  CornerHandleKey,
  AspectRatioPreset,
  StraightenerSide,
  StraightenerSideState,
  DocumentStraightenerState,
} from "@/types/document-straightener";
import type {
  DocumentDimensions,
  DocumentEnhancementSettings,
  DocumentPrintSettings,
  DocumentPrintStudioState,
  DocumentPrintLayoutSettings,
  PrintStudioMode,
  PrintStudioArrangement,
  DocumentSideResult,
  DocumentTypeDefinition,
} from "@/types/document-studio";
import {
  createDefaultEnhancementSettings,
  createDefaultPrintSettings,
  createDefaultPrintStudioState,
  createDefaultPrintLayoutSettings,
  DEFAULT_PRINT_STUDIO_STATE,
} from "@/types/document-studio";
import {
  warpPerspectiveCanvas,
  calculateOutputDimensions,
  createDefaultQuad,
  rotatePerspectiveQuad,
} from "@/lib/document/perspective-engine";
import { renderEnhancedFromUrl } from "@/lib/document/document-enhancer";
import { revokeObjectUrlSafely, createTrackedObjectURL } from "@/lib/utils/memory";
import { loadImageElement } from "@/lib/document/document-cropper";

const createEmptySideState = (): StraightenerSideState => ({
  file: null,
  previewUrl: null,
  dimensions: null,
  rotation: 0,
  quad: null,
  straightenedUrl: null,
  straightenedBlob: null,
  straightenedDimensions: null,
  aspectRatioPreset: "auto",
  enhancements: createDefaultEnhancementSettings(),
  enhancedPreviewUrl: null,
  enhancedBlob: null,
  printSettings: createDefaultPrintSettings("aadhaar"),
  isConfirmed: false,
  autoDetectConfidence: null,
  isLoading: false,
  error: null,
});

export const DOCUMENT_STRAIGHTENER_DEF: DocumentTypeDefinition = {
  id: "custom",
  name: "Document Straightener",
  shortName: "Straightened Doc",
  category: "Utilities",
  description: "Straightened perspective-corrected document photographs",
  supportedSides: ["front", "back"],
  defaultSides: ["front", "back"],
  allowsSideSelection: true,
  badge: "Perspective Corrected",
  iconName: "Maximize2",
};

export function useDocumentStraightener() {
  const [front, setFront] = useState<StraightenerSideState>(createEmptySideState);
  const [back, setBack] = useState<StraightenerSideState>(createEmptySideState);

  // Active crop editor modal state
  const [activeCropSide, setActiveCropSide] = useState<StraightenerSide | null>(null);

  // Workflow guidance: prompts user after front confirmation to add back side or proceed
  const [showBackPrompt, setShowBackPrompt] = useState<boolean>(false);

  // Overall workspace active side view in preview mode
  const [activePreviewSide, setActivePreviewSide] = useState<StraightenerSide>("front");

  // Print Studio State
  const [printStudioState, setPrintStudioState] = useState<DocumentPrintStudioState>(() =>
    createDefaultPrintStudioState(false)
  );

  // General loading & message state
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Stable references for side states to prevent asynchronous stale closures
  const frontRef = useRef(front);
  frontRef.current = front;
  const backRef = useRef(back);
  backRef.current = back;

  // Render sequence counters to discard out-of-order stale async renders
  const renderSeqRef = useRef<{ front: number; back: number }>({ front: 0, back: 0 });

  // Debounce timers for slider updates to prevent overlapping canvas operations
  const debounceTimerRef = useRef<{
    front: NodeJS.Timeout | null;
    back: NodeJS.Timeout | null;
  }>({ front: null, back: null });

  // In-flight enhancement render promises
  const inFlightPromiseRef = useRef<{
    front: Promise<any> | null;
    back: Promise<any> | null;
  }>({ front: null, back: null });

  // Track all created Object URLs for reliable revocation
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const registerUrl = useCallback((url: string | null) => {
    if (url && url.startsWith("blob:")) {
      objectUrlsRef.current.add(url);
    }
    return url;
  }, []);

  const revokeUrl = useCallback((url: string | null) => {
    if (url && url.startsWith("blob:")) {
      objectUrlsRef.current.delete(url);
      revokeObjectUrlSafely(url);
    }
  }, []);

  // Revoke all URLs on unmount
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => {
        revokeObjectUrlSafely(url);
      });
      urls.clear();
    };
  }, []);

  /**
   * Uploads and registers a source document photograph for Front or Back side.
   */
  const uploadSidePhoto = useCallback(
    async (side: StraightenerSide, file: File) => {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file (JPG, PNG, WebP).");
      }

      setIsProcessing(true);
      setStatusMessage(`Loading ${side === "front" ? "Front" : "Back"} photograph into browser memory...`);

      try {
        const previewUrl = URL.createObjectURL(file);
        registerUrl(previewUrl);
        const img = await loadImageElement(previewUrl);
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        const defaultQuad = createDefaultQuad(w, h, 0.1);

        const updater = (prev: StraightenerSideState): StraightenerSideState => {
          revokeUrl(prev.previewUrl);
          revokeUrl(prev.straightenedUrl);
          revokeUrl(prev.enhancedPreviewUrl);

          return {
            ...prev,
            file,
            previewUrl,
            dimensions: { width: w, height: h, aspectRatio: w / h },
            rotation: 0,
            quad: prev.quad || defaultQuad, // Preserve previous quad if user replaces image
            straightenedUrl: null,
            straightenedBlob: null,
            straightenedDimensions: null,
            enhancedPreviewUrl: null,
            enhancedBlob: null,
            isConfirmed: false,
            isLoading: false,
            error: null,
          };
        };

        if (side === "front") {
          setFront(updater);
        } else {
          setBack(updater);
          setShowBackPrompt(false);
        }

        // Open perspective cropper immediately for this side
        setActiveCropSide(side);
      } catch (err: any) {
        setStatusMessage(err?.message || "Failed to load image");
      } finally {
        setIsProcessing(false);
      }
    },
    [registerUrl, revokeUrl]
  );

  /**
   * Confirms four corners crop and executes perspective transformation at full resolution.
   */
  const confirmSideCrop = useCallback(
    async (
      side: StraightenerSide,
      quad: PerspectiveQuad,
      rotation: number,
      aspectRatioPreset: AspectRatioPreset
    ) => {
      const currentSide = side === "front" ? front : back;
      if (!currentSide.previewUrl) return;

      setIsProcessing(true);
      setStatusMessage(`Straightening ${side === "front" ? "Front" : "Back"} side perspective...`);

      try {
        // 1. Load source image element
        const img = await loadImageElement(currentSide.previewUrl);

        // 2. If rotated, pre-render rotated image to canvas for exact pixel alignment
        const isRotated = rotation % 360 !== 0;
        let sourceCanvas: HTMLCanvasElement | HTMLImageElement = img;

        if (isRotated) {
          const normRot = ((rotation % 360) + 360) % 360;
          const is90or270 = normRot === 90 || normRot === 270;
          const rotW = is90or270 ? img.naturalHeight : img.naturalWidth;
          const rotH = is90or270 ? img.naturalWidth : img.naturalHeight;

          const canvas = document.createElement("canvas");
          canvas.width = rotW;
          canvas.height = rotH;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not create intermediate canvas");

          ctx.translate(rotW / 2, rotH / 2);
          ctx.rotate((normRot * Math.PI) / 180);
          ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

          sourceCanvas = canvas;
        }

        // 3. Compute target output dimensions
        const outDims = calculateOutputDimensions(quad, aspectRatioPreset);

        // 4. Perform perspective warp with bilinear interpolation
        const warpResult = await warpPerspectiveCanvas(
          sourceCanvas,
          quad,
          outDims.width,
          outDims.height,
          "image/png"
        );

        registerUrl(warpResult.previewUrl);

        // 5. Apply default/current non-destructive enhancements
        let enhancedUrl = warpResult.previewUrl;
        let enhancedBlob: Blob | null = warpResult.blob;

        try {
          const enhResult = await renderEnhancedFromUrl(
            warpResult.previewUrl,
            outDims.width,
            outDims.height,
            currentSide.enhancements,
            "image/png"
          );
          registerUrl(enhResult.previewUrl);
          enhancedUrl = enhResult.previewUrl;
          enhancedBlob = enhResult.blob;
        } catch {
          // Fall back to unenhanced if enhancement failed
        }

        // 6. Update print settings target dimensions
        const updatedPrintSettings: DocumentPrintSettings = {
          ...currentSide.printSettings,
          targetWidthPx: outDims.width,
          targetHeightPx: outDims.height,
          aspectRatio: outDims.aspectRatio,
        };

        const sideDimensions: DocumentDimensions = {
          width: outDims.width,
          height: outDims.height,
          aspectRatio: outDims.aspectRatio,
        };

        const updater = (prev: StraightenerSideState): StraightenerSideState => {
          revokeUrl(prev.straightenedUrl);
          revokeUrl(prev.enhancedPreviewUrl);

          return {
            ...prev,
            rotation,
            quad,
            aspectRatioPreset,
            straightenedUrl: warpResult.previewUrl,
            straightenedBlob: warpResult.blob,
            straightenedDimensions: sideDimensions,
            enhancedPreviewUrl: enhancedUrl,
            enhancedBlob,
            printSettings: updatedPrintSettings,
            isConfirmed: true,
            isLoading: false,
            error: null,
          };
        };

        if (side === "front") {
          setFront(updater);
          // If back side hasn't been uploaded yet, prompt the user
          if (!back.isConfirmed && !back.file) {
            setShowBackPrompt(true);
          }
        } else {
          setBack(updater);
          setShowBackPrompt(false);
        }

        // Close cropper
        setActiveCropSide(null);
        setActivePreviewSide(side);
        setStatusMessage(null);
      } catch (err: any) {
        setStatusMessage(err?.message || "Failed to straighten document");
      } finally {
        setIsProcessing(false);
      }
    },
    [front, back, registerUrl, revokeUrl]
  );

  /**
   * Re-opens the perspective crop editor for a side, preserving its existing corner points.
   */
  const reopenCropEditor = useCallback((side: StraightenerSide) => {
    setActiveCropSide(side);
  }, []);

  /**
   * Skips back side when user only has a single-sided document.
   */
  const skipBackSide = useCallback(() => {
    setShowBackPrompt(false);
    setPrintStudioState((prev) => ({
      ...prev,
      mode: "front-only",
    }));
  }, []);

  /**
   * Closes the active crop editor without applying new changes.
   */
  const cancelCropEditor = useCallback(() => {
    setActiveCropSide(null);
  }, []);

  /**
   * Updates non-destructive enhancement settings for a side.
   * Handles asynchronous image processing reliably with debouncing,
   * race-condition prevention, and immediate reactive state updates.
   */
  const setSideEnhancement = useCallback(
    (
      side: StraightenerSide,
      key: keyof DocumentEnhancementSettings,
      value: number | boolean
    ) => {
      const isFront = side === "front";
      const currentSide = isFront ? frontRef.current : backRef.current;
      if (!currentSide.straightenedUrl) return;

      const nextEnhancements: DocumentEnhancementSettings = {
        ...currentSide.enhancements,
        [key]: value,
      };

      // 1. Synchronously update enhancements in state so UI controls and sliders are immediately responsive
      const stateUpdater = (prev: StraightenerSideState): StraightenerSideState => ({
        ...prev,
        enhancements: nextEnhancements,
      });

      if (isFront) setFront(stateUpdater);
      else setBack(stateUpdater);

      // 2. Increment render sequence id for this side to prevent out-of-order stale race conditions
      const seq = ++renderSeqRef.current[side];

      // 3. Clear any existing debounce timer for this side
      if (debounceTimerRef.current[side]) {
        clearTimeout(debounceTimerRef.current[side]!);
        debounceTimerRef.current[side] = null;
      }

      // 4. Debounce: instant (0ms) for toggles, short debounce (25ms) for sliders
      const delay = typeof value === "boolean" ? 0 : 25;

      const runRender = async () => {
        const activeSideData = isFront ? frontRef.current : backRef.current;
        if (!activeSideData.straightenedUrl) return;

        const w = activeSideData.straightenedDimensions?.width || 1000;
        const h = activeSideData.straightenedDimensions?.height || 1000;

        try {
          const renderPromise = renderEnhancedFromUrl(
            activeSideData.straightenedUrl,
            w,
            h,
            nextEnhancements,
            "image/png"
          );
          inFlightPromiseRef.current[side] = renderPromise;

          const result = await renderPromise;

          // Check if this render is still the latest one for this side
          if (seq === renderSeqRef.current[side]) {
            registerUrl(result.previewUrl);

            const commitUpdater = (prev: StraightenerSideState): StraightenerSideState => {
              revokeUrl(prev.enhancedPreviewUrl);
              return {
                ...prev,
                enhancements: nextEnhancements,
                enhancedPreviewUrl: result.previewUrl,
                enhancedBlob: result.blob,
              };
            };

            if (isFront) setFront(commitUpdater);
            else setBack(commitUpdater);
          } else {
            // Older render result was superseded by a newer one; revoke the unused preview URL
            URL.revokeObjectURL(result.previewUrl);
          }
        } catch (err) {
          console.error(`Enhancement render failed for ${side}:`, err);
        } finally {
          if (seq === renderSeqRef.current[side]) {
            inFlightPromiseRef.current[side] = null;
          }
        }
      };

      if (delay === 0) {
        runRender();
      } else {
        debounceTimerRef.current[side] = setTimeout(runRender, delay);
      }
    },
    [registerUrl, revokeUrl]
  );

  /**
   * Resets enhancements for a side to defaults and re-renders enhanced image.
   */
  const resetSideEnhancements = useCallback(
    async (side: StraightenerSide) => {
      const isFront = side === "front";
      const currentSide = isFront ? frontRef.current : backRef.current;
      if (!currentSide.straightenedUrl) return;

      const defaultEnh = createDefaultEnhancementSettings();

      if (debounceTimerRef.current[side]) {
        clearTimeout(debounceTimerRef.current[side]!);
        debounceTimerRef.current[side] = null;
      }

      if (isFront) {
        setFront((prev) => ({ ...prev, enhancements: defaultEnh }));
      } else {
        setBack((prev) => ({ ...prev, enhancements: defaultEnh }));
      }

      const seq = ++renderSeqRef.current[side];
      const w = currentSide.straightenedDimensions?.width || 1000;
      const h = currentSide.straightenedDimensions?.height || 1000;

      try {
        const renderPromise = renderEnhancedFromUrl(
          currentSide.straightenedUrl,
          w,
          h,
          defaultEnh,
          "image/png"
        );
        inFlightPromiseRef.current[side] = renderPromise;

        const result = await renderPromise;

        if (seq === renderSeqRef.current[side]) {
          registerUrl(result.previewUrl);

          const commitUpdater = (prev: StraightenerSideState): StraightenerSideState => {
            revokeUrl(prev.enhancedPreviewUrl);
            return {
              ...prev,
              enhancements: defaultEnh,
              enhancedPreviewUrl: result.previewUrl,
              enhancedBlob: result.blob,
            };
          };

          if (isFront) setFront(commitUpdater);
          else setBack(commitUpdater);
        } else {
          URL.revokeObjectURL(result.previewUrl);
        }
      } catch (err) {
        console.error(`Reset enhancements failed for ${side}:`, err);
      } finally {
        if (seq === renderSeqRef.current[side]) {
          inFlightPromiseRef.current[side] = null;
        }
      }
    },
    [registerUrl, revokeUrl]
  );

  /**
   * Updates print settings (DPI, physical dimensions) for a side.
   */
  const setSidePrintSettings = useCallback(
    (side: StraightenerSide, updates: Partial<DocumentPrintSettings>) => {
      const updater = (prev: StraightenerSideState): StraightenerSideState => ({
        ...prev,
        printSettings: { ...prev.printSettings, ...updates },
      });

      if (side === "front") setFront(updater);
      else setBack(updater);
    },
    []
  );

  /**
   * Print Studio Controls
   */
  const setPrintStudioMode = useCallback((mode: PrintStudioMode) => {
    setPrintStudioState((prev) => ({ ...prev, mode }));
  }, []);

  const setPrintStudioArrangement = useCallback((arrangement: PrintStudioArrangement) => {
    setPrintStudioState((prev) => ({ ...prev, arrangement }));
  }, []);

  const setPrintLayoutSettings = useCallback((updates: Partial<DocumentPrintLayoutSettings>) => {
    setPrintStudioState((prev) => ({
      ...prev,
      layout: { ...(prev.layout || createDefaultPrintLayoutSettings()), ...updates },
    }));
  }, []);

  /**
   * Resets all state and safely revokes all ephemeral memory.
   */
  const clearAll = useCallback(() => {
    if (debounceTimerRef.current.front) {
      clearTimeout(debounceTimerRef.current.front);
      debounceTimerRef.current.front = null;
    }
    if (debounceTimerRef.current.back) {
      clearTimeout(debounceTimerRef.current.back);
      debounceTimerRef.current.back = null;
    }
    renderSeqRef.current = { front: 0, back: 0 };
    inFlightPromiseRef.current = { front: null, back: null };

    revokeUrl(front.previewUrl);
    revokeUrl(front.straightenedUrl);
    revokeUrl(front.enhancedPreviewUrl);
    revokeUrl(back.previewUrl);
    revokeUrl(back.straightenedUrl);
    revokeUrl(back.enhancedPreviewUrl);

    setFront(createEmptySideState());
    setBack(createEmptySideState());
    setActiveCropSide(null);
    setShowBackPrompt(false);
    setActivePreviewSide("front");
    setStatusMessage(null);
  }, [front, back, revokeUrl]);

  // Effective blobs and URLs: strictly use enhancedBlob/enhancedPreviewUrl if available,
  // guaranteeing that PDF generation, PNG export, and preview all receive the exact same final enhanced document.
  const effectiveFrontBlob = front.enhancedBlob || front.straightenedBlob;
  const effectiveFrontUrl = front.enhancedPreviewUrl || front.straightenedUrl;

  const effectiveBackBlob = back.enhancedBlob || back.straightenedBlob;
  const effectiveBackUrl = back.enhancedPreviewUrl || back.straightenedUrl;

  // Map StraightenerSideState to DocumentSideResult for seamless integration with Document Studio components
  const frontSideResult: DocumentSideResult = {
    crop: null,
    rotation: front.rotation,
    zoom: 1,
    aspectRatioLocked: true,
    targetAspectRatio: front.straightenedDimensions?.aspectRatio || null,
    croppedPreviewUrl: effectiveFrontUrl,
    croppedBlob: effectiveFrontBlob,
    croppedDimensions: front.straightenedDimensions,
    isCropped: front.isConfirmed,
    isCropEditorOpen: activeCropSide === "front",
    activeView: "cropped",
    enhancements: front.enhancements,
    enhancedPreviewUrl: front.enhancedPreviewUrl || effectiveFrontUrl,
    enhancedBlob: front.enhancedBlob || effectiveFrontBlob,
    printSettings: front.printSettings,
  };

  const backSideResult: DocumentSideResult = {
    crop: null,
    rotation: back.rotation,
    zoom: 1,
    aspectRatioLocked: true,
    targetAspectRatio: back.straightenedDimensions?.aspectRatio || null,
    croppedPreviewUrl: effectiveBackUrl,
    croppedBlob: effectiveBackBlob,
    croppedDimensions: back.straightenedDimensions,
    isCropped: back.isConfirmed,
    isCropEditorOpen: activeCropSide === "back",
    activeView: "cropped",
    enhancements: back.enhancements,
    enhancedPreviewUrl: back.enhancedPreviewUrl || effectiveBackUrl,
    enhancedBlob: back.enhancedBlob || effectiveBackBlob,
    printSettings: back.printSettings,
  };

  const hasAnyPhoto = Boolean(front.file || back.file);
  const isFrontDone = front.isConfirmed && Boolean(front.straightenedUrl);
  const isBackDone = back.isConfirmed && Boolean(back.straightenedUrl);
  const isSingleSided = isFrontDone && !back.file && !showBackPrompt;

  return {
    front,
    back,
    frontSideResult,
    backSideResult,
    activeCropSide,
    activePreviewSide,
    showBackPrompt,
    printStudioState,
    isProcessing,
    statusMessage,
    hasAnyPhoto,
    isFrontDone,
    isBackDone,
    isSingleSided,
    uploadSidePhoto,
    confirmSideCrop,
    reopenCropEditor,
    cancelCropEditor,
    skipBackSide,
    setSideEnhancement,
    resetSideEnhancements,
    setSidePrintSettings,
    setPrintStudioMode,
    setPrintStudioArrangement,
    setPrintLayoutSettings,
    setActivePreviewSide,
    clearAll,
  };
}
