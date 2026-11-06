/**
 * Phase 08B (Corrected) — useDocumentStudio Hook
 *
 * Implements the intended document scanning & cropping workflow:
 * - The user uploads ONE document file (PDF, JPG, PNG) containing both Front and Back sides (or single-side for PAN).
 * - Automatic detection scans the sheet, separates both sides, and generates independent high-res Canvas crops.
 * - Displays Front Side crop in the Front preview and Back Side crop in the Back preview.
 * - Allows adjusting either side's crop independently on the source document.
 * - For PDFs, enables page selection with automatic re-detection.
 * - Full 90° rotation, zoom, aspect ratio locks, and honest fallback support.
 * - Strict ephemeral memory management: 0 bytes uploaded, 0 bytes persisted.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  DocumentTypeId,
  DocumentSide,
  CustomSidesMode,
  SourceLayoutMode,
  DocumentSourceFile,
  DocumentSideResult,
  DocumentStudioState,
  DocumentAutoDetectState,
  DocumentDimensions,
  DocumentEnhancementSettings,
  DocumentPrintSettings,
} from "@/types/document-studio";
import {
  createDefaultEnhancementSettings,
  isEnhancementActive,
  createDefaultPrintSettings,
} from "@/types/document-studio";
import {
  updatePrintSettings,
} from "@/lib/document/document-dimensions";
import {
  renderEnhancedFromUrl,
} from "@/lib/document/document-enhancer";
import type { CropCoordinates } from "@/types/crop";
import {
  DEFAULT_DOCUMENT_TYPE_ID,
  getDocumentTypeDefinition,
  getAvailableSides,
  isSideActive,
} from "@/constants/document-studio";
import {
  processDocumentFile,
  renderPdfPageToBlob,
} from "@/lib/document/document-processor";
import {
  detectDualDocumentBoundaries,
} from "@/lib/document/document-detector";
import {
  inspectVectorVoterIdPdf,
  type VectorPdfInspectionResult,
} from "@/lib/document/pdf-vector-detector";
import {
  loadImageElement,
  renderDocumentCrop,
  normalizeRotation,
  getRotatedDimensions,
  adjustCropForRotation,
} from "@/lib/document/document-cropper";

const createEmptySource = (): DocumentSourceFile => ({
  file: null,
  fileType: null,
  previewUrl: null,
  dimensions: null,
  fileSizeFormatted: null,
  fileName: null,
  pageCount: 0,
  currentPage: 1,
  isLoading: false,
  error: null,
});

const createEmptySideResult = (
  targetAspectRatio: number | null = null,
  docType: DocumentTypeId = "aadhaar"
): DocumentSideResult => ({
  crop: null,
  rotation: 0,
  zoom: 1,
  aspectRatioLocked: true,
  targetAspectRatio,
  croppedPreviewUrl: null,
  croppedBlob: null,
  croppedDimensions: null,
  isCropped: false,
  isCropEditorOpen: false,
  activeView: "cropped",
  enhancements: createDefaultEnhancementSettings(),
  enhancedPreviewUrl: null,
  enhancedBlob: null,
  showBefore: false,
  printSettings: createDefaultPrintSettings(docType),
});

export function useDocumentStudio(
  initialDocType: DocumentTypeId = DEFAULT_DOCUMENT_TYPE_ID
) {
  const [selectedDocType, setSelectedDocType] =
    useState<DocumentTypeId>(initialDocType);
  const [customSidesMode, setCustomSidesMode] =
    useState<CustomSidesMode>("both");
  const [sourceLayoutMode, setSourceLayoutModeState] =
    useState<SourceLayoutMode>("auto");

  const currentDocDef = getDocumentTypeDefinition(selectedDocType);
  const targetAspect = currentDocDef.targetDimensions?.aspectRatio ?? null;
  const isSingleSided = !currentDocDef.supportedSides.includes("back");

  const [source, setSource] = useState<DocumentSourceFile>(createEmptySource);
  const [front, setFront] = useState<DocumentSideResult>(() =>
    createEmptySideResult(targetAspect, initialDocType)
  );
  const [back, setBack] = useState<DocumentSideResult>(() =>
    createEmptySideResult(targetAspect, initialDocType)
  );
  const [autoDetectStatus, setAutoDetectStatus] = useState<DocumentAutoDetectState>({
    status: "idle",
  });

  // Track initial detected crops for independent reset operations
  const initialFrontCropRef = useRef<CropCoordinates | null>(null);
  const initialBackCropRef = useRef<CropCoordinates | null>(null);
  const vectorInfoRef = useRef<VectorPdfInspectionResult | null>(null);

  // Track active Object URLs to guarantee revocation on unmount, replace, or reset
  const sourceUrlRef = useRef<string | null>(null);
  const frontCroppedUrlRef = useRef<string | null>(null);
  const backCroppedUrlRef = useRef<string | null>(null);
  const frontEnhancedUrlRef = useRef<string | null>(null);
  const backEnhancedUrlRef = useRef<string | null>(null);

  // Debounce timers for enhancement rendering
  const frontEnhanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backEnhanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live state refs to prevent stale closures and satisfies hook dependencies
  const frontRef = useRef(front);
  const backRef = useRef(back);
  frontRef.current = front;
  backRef.current = back;

  sourceUrlRef.current = source.previewUrl;
  frontCroppedUrlRef.current = front.croppedPreviewUrl;
  backCroppedUrlRef.current = back.croppedPreviewUrl;
  frontEnhancedUrlRef.current = front.enhancedPreviewUrl ?? null;
  backEnhancedUrlRef.current = back.enhancedPreviewUrl ?? null;

  // Cleanup all object URLs and timers on unmount
  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (frontCroppedUrlRef.current) URL.revokeObjectURL(frontCroppedUrlRef.current);
      if (backCroppedUrlRef.current) URL.revokeObjectURL(backCroppedUrlRef.current);
      if (frontEnhancedUrlRef.current) URL.revokeObjectURL(frontEnhancedUrlRef.current);
      if (backEnhancedUrlRef.current) URL.revokeObjectURL(backEnhancedUrlRef.current);
      if (frontEnhanceTimerRef.current) clearTimeout(frontEnhanceTimerRef.current);
      if (backEnhanceTimerRef.current) clearTimeout(backEnhanceTimerRef.current);
    };
  }, []);

  const availableSides = getAvailableSides(currentDocDef, customSidesMode);

  /**
   * Internal helper: Renders Canvas crop for a specific side from the source image,
   * normalizing to standard ISO CR80 (1011 x 638 px at 300 DPI) without distortion.
   */
  const renderSideCropCanvas = useCallback(
    async (
      sourceUrl: string,
      sourceWidth: number,
      sourceHeight: number,
      crop: CropCoordinates,
      rotation: number
    ) => {
      const img = await loadImageElement(sourceUrl);
      return renderDocumentCrop(img, sourceWidth, sourceHeight, {
        crop,
        rotation,
        normalizeCR80: true, // Universal ISO/IEC 7810 ID-1 (CR80) standardization
      });
    },
    []
  );

  /**
   * Internal helper: Executes document-specific detection and initializes crops.
   */
  const executeDetectionAndCropping = useCallback(
    async (
      sourceUrl: string,
      sourceWidth: number,
      sourceHeight: number,
      docTargetAspect: number | null,
      singleSided: boolean,
      forceLayout?: SourceLayoutMode,
      overrideDocType?: DocumentTypeId,
      forceResetManual: boolean = false
    ) => {
      const activeDocType = overrideDocType ?? selectedDocType;
      const typeDef = getDocumentTypeDefinition(activeDocType);

      setAutoDetectStatus({
        status: "detecting",
        message: `Detecting ${typeDef.name} using document-specific strategy...`,
      });

      try {
        const img = await loadImageElement(sourceUrl);
        // Only provide vectorInfo for Voter ID! Never leak into PAN, Aadhaar, or Ration Card!
        const isVoter = activeDocType === "voter-id";
        const detection = await detectDualDocumentBoundaries(
          img,
          sourceWidth,
          sourceHeight,
          {
            targetAspectRatio: docTargetAspect,
            isSingleSide: singleSided,
            forceLayout: forceLayout === "auto" ? undefined : forceLayout,
            safetyMarginPercent: 1.5,
            docTypeId: activeDocType,
            vectorInfo: isVoter ? vectorInfoRef.current : null,
          }
        );

        // Store initial detected crops for independent reset operations
        initialFrontCropRef.current = detection.frontCrop;
        initialBackCropRef.current = detection.backCrop;

        // Render Front crop standardized to CR80
        const frontResult = await renderDocumentCrop(img, sourceWidth, sourceHeight, {
          crop: detection.frontCrop,
          rotation: 0,
          normalizeCR80: true,
        });

        // Re-apply existing front enhancements if active
        let frontEnhancedRes: { previewUrl: string; blob: Blob } | null = null;
        if (isEnhancementActive(frontRef.current.enhancements) && frontResult.previewUrl) {
          try {
            frontEnhancedRes = await renderEnhancedFromUrl(
              frontResult.previewUrl,
              frontResult.dimensions.width,
              frontResult.dimensions.height,
              frontRef.current.enhancements
            );
          } catch (e) {
            console.error("Re-apply front enhancements error:", e);
          }
        }

        setFront((prev) => {
          const keepManual = !forceResetManual && prev.isManualCrop && prev.crop;
          if (keepManual) {
            // Manual cropping overrides automatic detection
            if (frontResult.previewUrl) URL.revokeObjectURL(frontResult.previewUrl);
            if (frontEnhancedRes) URL.revokeObjectURL(frontEnhancedRes.previewUrl);
            return prev;
          }
          if (frontCroppedUrlRef.current) {
            URL.revokeObjectURL(frontCroppedUrlRef.current);
          }
          if (frontEnhancedUrlRef.current) {
            URL.revokeObjectURL(frontEnhancedUrlRef.current);
          }
          if (frontEnhancedRes) {
            frontEnhancedUrlRef.current = frontEnhancedRes.previewUrl;
          } else {
            frontEnhancedUrlRef.current = null;
          }

          return {
            ...prev,
            crop: detection.frontCrop,
            rotation: 0,
            zoom: 1,
            aspectRatioLocked: true,
            targetAspectRatio: docTargetAspect,
            croppedPreviewUrl: frontResult.previewUrl,
            croppedBlob: frontResult.blob,
            croppedDimensions: frontResult.dimensions,
            enhancedPreviewUrl: frontEnhancedRes?.previewUrl ?? null,
            enhancedBlob: frontEnhancedRes?.blob ?? null,
            isCropped: true,
            isManualCrop: false,
            isCropEditorOpen: false,
            activeView: "cropped",
            enhancements: prev.enhancements ?? createDefaultEnhancementSettings(),
            showBefore: prev.showBefore ?? false,
          };
        });

        // Render Back crop if document is dual-sided
        if (!singleSided && detection.backCrop) {
          const backResult = await renderDocumentCrop(img, sourceWidth, sourceHeight, {
            crop: detection.backCrop,
            rotation: 0,
            normalizeCR80: true,
          });

          let backEnhancedRes: { previewUrl: string; blob: Blob } | null = null;
          if (isEnhancementActive(backRef.current.enhancements) && backResult.previewUrl) {
            try {
              backEnhancedRes = await renderEnhancedFromUrl(
                backResult.previewUrl,
                backResult.dimensions.width,
                backResult.dimensions.height,
                backRef.current.enhancements
              );
            } catch (e) {
              console.error("Re-apply back enhancements error:", e);
            }
          }

          setBack((prev) => {
            const keepManual = !forceResetManual && prev.isManualCrop && prev.crop;
            if (keepManual) {
              // Manual cropping overrides automatic detection
              if (backResult.previewUrl) URL.revokeObjectURL(backResult.previewUrl);
              if (backEnhancedRes) URL.revokeObjectURL(backEnhancedRes.previewUrl);
              return prev;
            }
            if (backCroppedUrlRef.current) {
              URL.revokeObjectURL(backCroppedUrlRef.current);
            }
            if (backEnhancedUrlRef.current) {
              URL.revokeObjectURL(backEnhancedUrlRef.current);
            }
            if (backEnhancedRes) {
              backEnhancedUrlRef.current = backEnhancedRes.previewUrl;
            } else {
              backEnhancedUrlRef.current = null;
            }

            return {
              ...prev,
              crop: detection.backCrop,
              rotation: 0,
              zoom: 1,
              aspectRatioLocked: true,
              targetAspectRatio: docTargetAspect,
              croppedPreviewUrl: backResult.previewUrl,
              croppedBlob: backResult.blob,
              croppedDimensions: backResult.dimensions,
              enhancedPreviewUrl: backEnhancedRes?.previewUrl ?? null,
              enhancedBlob: backEnhancedRes?.blob ?? null,
              isCropped: true,
              isManualCrop: false,
              isCropEditorOpen: false,
              activeView: "cropped",
              enhancements: prev.enhancements ?? createDefaultEnhancementSettings(),
              showBefore: prev.showBefore ?? false,
            };
          });
        } else {
          setBack(createEmptySideResult(docTargetAspect, selectedDocType));
        }

        setAutoDetectStatus({
          status: detection.detected ? "success" : "failed",
          message: detection.message,
          layout: detection.layout,
          confidence: detection.confidence,
        });
      } catch (err) {
        console.error("Detection & crop error:", err);
        setAutoDetectStatus({
          status: "failed",
          message: "Automatic detection encountered an issue. Default regions applied.",
        });
      }
    },
    [selectedDocType]
  );

  /**
   * Switches the active document type and dispatches to the document-specific strategy.
   */
  const setDocumentType = useCallback(
    async (docType: DocumentTypeId) => {
      setSelectedDocType(docType);
      if (docType !== "voter-id") {
        vectorInfoRef.current = null;
      }
      const newDef = getDocumentTypeDefinition(docType);
      const newAspect = newDef.targetDimensions?.aspectRatio ?? null;
      const isSingle = !newDef.supportedSides.includes("back");

      // If a source document is already loaded, re-run document-specific detection
      if (source.previewUrl && source.dimensions) {
        await executeDetectionAndCropping(
          source.previewUrl,
          source.dimensions.width,
          source.dimensions.height,
          newAspect,
          isSingle,
          undefined,
          docType
        );
      } else {
        setFront((prev) => ({ ...prev, targetAspectRatio: newAspect }));
        setBack((prev) => ({ ...prev, targetAspectRatio: newAspect }));
      }
    },
    [source.previewUrl, source.dimensions, executeDetectionAndCropping]
  );

  /**
   * Primary Document Upload:
   * Accepts a SINGLE document file (PDF or Image) containing both sides.
   */
  const uploadDocumentFile = useCallback(
    async (file: File, pageNumber: number = 1) => {
      setSource((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // Revoke previous URLs
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (frontCroppedUrlRef.current) URL.revokeObjectURL(frontCroppedUrlRef.current);
      if (backCroppedUrlRef.current) URL.revokeObjectURL(backCroppedUrlRef.current);

      try {
        const result = await processDocumentFile(file, pageNumber);

        // If PDF, inspect for vector embedded image placements ONLY for Voter ID!
        if (result.fileType === "pdf" && selectedDocType === "voter-id") {
          try {
            const arrayBuffer = await file.arrayBuffer();
            vectorInfoRef.current = await inspectVectorVoterIdPdf(
              arrayBuffer,
              result.dimensions.width,
              result.dimensions.height
            );
          } catch (e) {
            console.warn("PDF vector inspection notice:", e);
            vectorInfoRef.current = null;
          }
        } else {
          vectorInfoRef.current = null;
        }

        setSource({
          file: result.file,
          fileType: result.fileType,
          previewUrl: result.previewUrl,
          dimensions: result.dimensions,
          fileSizeFormatted: result.fileSizeFormatted,
          fileName: result.fileName,
          pageCount: result.pageCount,
          currentPage: result.currentPage,
          isLoading: false,
          error: null,
        });

        // Automatically detect and crop both sides using document-specific strategy
        await executeDetectionAndCropping(
          result.previewUrl,
          result.dimensions.width,
          result.dimensions.height,
          targetAspect,
          isSingleSided,
          undefined,
          selectedDocType
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to process document file.";
        setSource((prev) => ({
          ...prev,
          isLoading: false,
          error: msg,
        }));
      }
    },
    [targetAspect, isSingleSided, selectedDocType, executeDetectionAndCropping]
  );

  /**
   * Changes the active page of a multi-page PDF document.
   */
  const changePdfPage = useCallback(
    async (newPage: number) => {
      if (!source.file || source.fileType !== "pdf") return;
      if (newPage < 1 || newPage > source.pageCount) return;

      setSource((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const { blob, width, height } = await renderPdfPageToBlob(
          source.file,
          newPage
        );

        if (source.previewUrl) URL.revokeObjectURL(source.previewUrl);
        const newPreviewUrl = URL.createObjectURL(blob);

        setSource((prev) => ({
          ...prev,
          previewUrl: newPreviewUrl,
          dimensions: {
            width,
            height,
            aspectRatio: width / height,
          },
          currentPage: newPage,
          isLoading: false,
          error: null,
        }));

        await executeDetectionAndCropping(
          newPreviewUrl,
          width,
          height,
          targetAspect,
          isSingleSided
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to render PDF page.";
        setSource((prev) => ({ ...prev, isLoading: false, error: msg }));
      }
    },
    [source.file, source.fileType, source.pageCount, source.previewUrl, targetAspect, isSingleSided, executeDetectionAndCropping]
  );

  /**
   * Opens the interactive crop editor for a specific side (front or back).
   */
  const openCropEditor = useCallback((side: DocumentSide) => {
    if (side === "front") {
      setFront((prev) => ({ ...prev, isCropEditorOpen: true }));
      setBack((prev) => ({ ...prev, isCropEditorOpen: false }));
    } else {
      setBack((prev) => ({ ...prev, isCropEditorOpen: true }));
      setFront((prev) => ({ ...prev, isCropEditorOpen: false }));
    }
  }, []);

  /**
   * Closes the interactive crop editor for a side.
   */
  const closeCropEditor = useCallback((side: DocumentSide) => {
    const setSide = side === "front" ? setFront : setBack;
    setSide((prev) => ({ ...prev, isCropEditorOpen: false }));
  }, []);

  /**
   * Updates the crop coordinates for a side during editing.
   */
  const setSideCrop = useCallback((side: DocumentSide, crop: CropCoordinates) => {
    const setSide = side === "front" ? setFront : setBack;
    setSide((prev) => ({ ...prev, crop }));
  }, []);

  /**
   * Sets rotation for a side.
   */
  const setSideRotation = useCallback((side: DocumentSide, rotation: number) => {
    const setSide = side === "front" ? setFront : setBack;
    setSide((prev) => ({ ...prev, rotation: normalizeRotation(rotation) }));
  }, []);

  /**
   * Sets zoom level for a side.
   */
  const setSideZoom = useCallback((side: DocumentSide, zoom: number) => {
    const setSide = side === "front" ? setFront : setBack;
    setSide((prev) => ({ ...prev, zoom: Math.max(0.2, Math.min(4.0, zoom)) }));
  }, []);

  /**
   * Toggles aspect ratio lock for a side.
   */
  const setSideAspectRatioLocked = useCallback(
    (side: DocumentSide, locked: boolean) => {
      const setSide = side === "front" ? setFront : setBack;
      setSide((prev) => ({ ...prev, aspectRatioLocked: locked }));
    },
    []
  );

  /**
   * Toggles between viewing the cropped result and the full source view for a side.
   */
  const toggleSideActiveView = useCallback((side: DocumentSide) => {
    const setSide = side === "front" ? setFront : setBack;
    setSide((prev) => ({
      ...prev,
      activeView: prev.activeView === "cropped" ? "original" : "cropped",
    }));
  }, []);

  /**
   * Applies the crop rectangle to a side and renders a new Canvas buffer.
   */
  const applyCrop = useCallback(
    async (
      side: DocumentSide,
      cropOverride?: CropCoordinates,
      rotationOverride?: number
    ) => {
      const currentSide = side === "front" ? front : back;
      const setSide = side === "front" ? setFront : setBack;

      if (!source.previewUrl || !source.dimensions) return;

      const crop = cropOverride ?? currentSide.crop;
      if (!crop) return;

      const rotation = rotationOverride ?? currentSide.rotation;

      setSource((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await renderSideCropCanvas(
          source.previewUrl,
          source.dimensions.width,
          source.dimensions.height,
          crop,
          rotation
        );

        if (currentSide.croppedPreviewUrl) {
          URL.revokeObjectURL(currentSide.croppedPreviewUrl);
        }

        let enhancedRes: { previewUrl: string; blob: Blob } | null = null;
        if (isEnhancementActive(currentSide.enhancements) && result.previewUrl) {
          try {
            enhancedRes = await renderEnhancedFromUrl(
              result.previewUrl,
              result.dimensions.width,
              result.dimensions.height,
              currentSide.enhancements
            );
          } catch (e) {
            console.error("Apply crop enhancement error:", e);
          }
        }

        const enhancedUrlRef = side === "front" ? frontEnhancedUrlRef : backEnhancedUrlRef;
        if (enhancedUrlRef.current) {
          URL.revokeObjectURL(enhancedUrlRef.current);
        }
        enhancedUrlRef.current = enhancedRes?.previewUrl ?? null;

        setSide((prev) => ({
          ...prev,
          crop,
          rotation,
          croppedPreviewUrl: result.previewUrl,
          croppedBlob: result.blob,
          croppedDimensions: result.dimensions,
          enhancedPreviewUrl: enhancedRes?.previewUrl ?? null,
          enhancedBlob: enhancedRes?.blob ?? null,
          isCropped: true,
          isManualCrop: true,
          isCropEditorOpen: false,
          activeView: "cropped",
        }));
      } catch (err) {
        console.error("Apply crop error:", err);
      } finally {
        setSource((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [source.previewUrl, source.dimensions, front, back, renderSideCropCanvas]
  );

  /**
   * Rotates a side by 90° clockwise or counterclockwise and re-renders that side's crop.
   */
  const rotateSide = useCallback(
    async (side: DocumentSide, direction: "cw" | "ccw") => {
      const currentSide = side === "front" ? front : back;
      const setSide = side === "front" ? setFront : setBack;

      if (!source.previewUrl || !source.dimensions || !currentSide.crop) return;

      const delta = direction === "cw" ? 90 : -90;
      const newRotation = normalizeRotation(currentSide.rotation + delta);

      setSource((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await renderSideCropCanvas(
          source.previewUrl,
          source.dimensions.width,
          source.dimensions.height,
          currentSide.crop,
          newRotation
        );

        if (currentSide.croppedPreviewUrl) {
          URL.revokeObjectURL(currentSide.croppedPreviewUrl);
        }

        let enhancedRes: { previewUrl: string; blob: Blob } | null = null;
        if (isEnhancementActive(currentSide.enhancements) && result.previewUrl) {
          try {
            enhancedRes = await renderEnhancedFromUrl(
              result.previewUrl,
              result.dimensions.width,
              result.dimensions.height,
              currentSide.enhancements
            );
          } catch (e) {
            console.error("Rotate side enhancement error:", e);
          }
        }

        const enhancedUrlRef = side === "front" ? frontEnhancedUrlRef : backEnhancedUrlRef;
        if (enhancedUrlRef.current) {
          URL.revokeObjectURL(enhancedUrlRef.current);
        }
        enhancedUrlRef.current = enhancedRes?.previewUrl ?? null;

        setSide((prev) => ({
          ...prev,
          rotation: newRotation,
          croppedPreviewUrl: result.previewUrl,
          croppedBlob: result.blob,
          croppedDimensions: result.dimensions,
          enhancedPreviewUrl: enhancedRes?.previewUrl ?? null,
          enhancedBlob: enhancedRes?.blob ?? null,
          activeView: "cropped",
        }));
      } catch (err) {
        console.error("Rotate side error:", err);
      } finally {
        setSource((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [source.previewUrl, source.dimensions, front, back, renderSideCropCanvas]
  );

  /**
   * Adjusts zoom scale for a side.
   */
  const zoomSide = useCallback((side: DocumentSide, delta: number) => {
    const setSide = side === "front" ? setFront : setBack;
    setSide((prev) => {
      const newZoom = Math.max(0.2, Math.min(4.0, Math.round((prev.zoom + delta) * 10) / 10));
      return { ...prev, zoom: newZoom };
    });
  }, []);

  /**
   * Re-runs automatic boundary detection on the current source document.
   */
  const runAutoDetection = useCallback(async () => {
    if (!source.previewUrl || !source.dimensions) return;
    await executeDetectionAndCropping(
      source.previewUrl,
      source.dimensions.width,
      source.dimensions.height,
      targetAspect,
      isSingleSided,
      sourceLayoutMode,
      undefined,
      false // Manual crops override automatic detection
    );
  }, [source.previewUrl, source.dimensions, targetAspect, isSingleSided, sourceLayoutMode, executeDetectionAndCropping]);

  /**
   * Switches the active source layout mode and immediately re-evaluates crops.
   */
  const setSourceLayoutMode = useCallback(
    async (mode: SourceLayoutMode) => {
      setSourceLayoutModeState(mode);
      if (source.previewUrl && source.dimensions) {
        await executeDetectionAndCropping(
          source.previewUrl,
          source.dimensions.width,
          source.dimensions.height,
          targetAspect,
          isSingleSided,
          mode,
          undefined,
          true // Force reset manual crops
        );
      }
    },
    [source.previewUrl, source.dimensions, targetAspect, isSingleSided, executeDetectionAndCropping]
  );

  /**
   * Manually applies a split layout fallback ("horizontal" or "vertical").
   */
  const applySplitLayout = useCallback(
    async (layout: "horizontal" | "vertical") => {
      await setSourceLayoutMode(layout);
    },
    [setSourceLayoutMode]
  );

  /**
   * Resets a specific side's crop independently back to its initial detected boundary,
   * without affecting or mutating the other side.
   */
  const resetCrop = useCallback(
    async (side: DocumentSide) => {
      if (!source.previewUrl || !source.dimensions) return;

      const isTargetFront = side === "front";
      const initialCrop = isTargetFront
        ? initialFrontCropRef.current
        : initialBackCropRef.current;

      if (!initialCrop) {
        // Fallback to auto-detection if no initial crop stored
        await runAutoDetection();
        return;
      }

      setSource((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await renderSideCropCanvas(
          source.previewUrl,
          source.dimensions.width,
          source.dimensions.height,
          initialCrop,
          0
        );

        const targetSide = isTargetFront ? frontRef.current : backRef.current;
        let enhancedRes: { previewUrl: string; blob: Blob } | null = null;
        if (isEnhancementActive(targetSide.enhancements) && result.previewUrl) {
          try {
            enhancedRes = await renderEnhancedFromUrl(
              result.previewUrl,
              result.dimensions.width,
              result.dimensions.height,
              targetSide.enhancements
            );
          } catch (e) {
            console.error("Reset crop enhancement error:", e);
          }
        }

        if (isTargetFront) {
          if (frontCroppedUrlRef.current) {
            URL.revokeObjectURL(frontCroppedUrlRef.current);
          }
          if (frontEnhancedUrlRef.current) {
            URL.revokeObjectURL(frontEnhancedUrlRef.current);
          }
          frontEnhancedUrlRef.current = enhancedRes?.previewUrl ?? null;

          setFront((prev) => ({
            ...prev,
            crop: initialCrop,
            rotation: 0,
            zoom: 1,
            croppedPreviewUrl: result.previewUrl,
            croppedBlob: result.blob,
            croppedDimensions: result.dimensions,
            enhancedPreviewUrl: enhancedRes?.previewUrl ?? null,
            enhancedBlob: enhancedRes?.blob ?? null,
            isCropped: true,
            isManualCrop: false,
            isCropEditorOpen: false,
            activeView: "cropped",
          }));
        } else {
          if (backCroppedUrlRef.current) {
            URL.revokeObjectURL(backCroppedUrlRef.current);
          }
          if (backEnhancedUrlRef.current) {
            URL.revokeObjectURL(backEnhancedUrlRef.current);
          }
          backEnhancedUrlRef.current = enhancedRes?.previewUrl ?? null;

          setBack((prev) => ({
            ...prev,
            crop: initialCrop,
            rotation: 0,
            zoom: 1,
            croppedPreviewUrl: result.previewUrl,
            croppedBlob: result.blob,
            croppedDimensions: result.dimensions,
            enhancedPreviewUrl: enhancedRes?.previewUrl ?? null,
            enhancedBlob: enhancedRes?.blob ?? null,
            isCropped: true,
            isManualCrop: false,
            isCropEditorOpen: false,
            activeView: "cropped",
          }));
        }
      } catch (err) {
        console.error(`Reset crop error for ${side}:`, err);
      } finally {
        setSource((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [source.previewUrl, source.dimensions, renderSideCropCanvas, runAutoDetection]
  );

  /**
   * Resets both front and back crops to their initial detected state.
   */
  const resetBothCrops = useCallback(async () => {
    if (!source.previewUrl || !source.dimensions) return;
    await executeDetectionAndCropping(
      source.previewUrl,
      source.dimensions.width,
      source.dimensions.height,
      targetAspect,
      isSingleSided,
      sourceLayoutMode,
      undefined,
      true // Force reset manual crops
    );
  }, [source.previewUrl, source.dimensions, targetAspect, isSingleSided, sourceLayoutMode, executeDetectionAndCropping]);

  /**
   * Updates an individual enhancement property for a specific side (front or back).
   * Sliders update state immediately and debounce canvas rendering (35ms).
   * Toggles (grayscale, invert) render canvas immediately (0ms).
   * Fully non-destructive: always processes from the clean unenhanced crop buffer.
   */
  const setSideEnhancement = useCallback(
    (
      side: DocumentSide,
      key: keyof DocumentEnhancementSettings,
      value: number | boolean
    ) => {
      const isTargetFront = side === "front";
      const targetSide = isTargetFront ? frontRef.current : backRef.current;
      const setSide = isTargetFront ? setFront : setBack;
      const timerRef = isTargetFront ? frontEnhanceTimerRef : backEnhanceTimerRef;
      const enhancedUrlRef = isTargetFront ? frontEnhancedUrlRef : backEnhancedUrlRef;

      const newSettings: DocumentEnhancementSettings = {
        ...targetSide.enhancements,
        [key]: value,
      };

      // 1. Immediately update React state for instant slider / toggle UI response
      setSide((prev) => ({
        ...prev,
        enhancements: newSettings,
      }));

      // If user reset all sliders to default (inactive)
      if (!isEnhancementActive(newSettings)) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (enhancedUrlRef.current) {
          URL.revokeObjectURL(enhancedUrlRef.current);
          enhancedUrlRef.current = null;
        }
        setSide((prev) => ({
          ...prev,
          enhancedPreviewUrl: null,
          enhancedBlob: null,
        }));
        return;
      }

      // 2. Debounce canvas rendering: instant (0ms) for toggles, 35ms for sliders
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const delay = typeof value === "boolean" ? 0 : 35;

      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        const currentSideData = isTargetFront ? frontRef.current : backRef.current;
        if (!currentSideData.croppedPreviewUrl || !currentSideData.croppedDimensions) return;

        try {
          const enhanced = await renderEnhancedFromUrl(
            currentSideData.croppedPreviewUrl,
            currentSideData.croppedDimensions.width,
            currentSideData.croppedDimensions.height,
            newSettings
          );

          if (enhancedUrlRef.current) {
            URL.revokeObjectURL(enhancedUrlRef.current);
          }
          enhancedUrlRef.current = enhanced.previewUrl;

          setSide((prev) => ({
            ...prev,
            enhancedPreviewUrl: enhanced.previewUrl,
            enhancedBlob: enhanced.blob,
          }));
        } catch (err) {
          console.error(`Enhancement render error for ${side}:`, err);
        }
      }, delay);
    },
    []
  );

  /**
   * Batch updates enhancement settings for a side.
   */
  const setSideEnhancements = useCallback(
    (side: DocumentSide, settings: Partial<DocumentEnhancementSettings>) => {
      const isTargetFront = side === "front";
      const targetSide = isTargetFront ? frontRef.current : backRef.current;
      const setSide = isTargetFront ? setFront : setBack;
      const timerRef = isTargetFront ? frontEnhanceTimerRef : backEnhanceTimerRef;
      const enhancedUrlRef = isTargetFront ? frontEnhancedUrlRef : backEnhancedUrlRef;

      const newSettings: DocumentEnhancementSettings = {
        ...targetSide.enhancements,
        ...settings,
      };

      setSide((prev) => ({
        ...prev,
        enhancements: newSettings,
      }));

      if (!isEnhancementActive(newSettings)) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (enhancedUrlRef.current) {
          URL.revokeObjectURL(enhancedUrlRef.current);
          enhancedUrlRef.current = null;
        }
        setSide((prev) => ({
          ...prev,
          enhancedPreviewUrl: null,
          enhancedBlob: null,
        }));
        return;
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        const currentSideData = isTargetFront ? frontRef.current : backRef.current;
        if (!currentSideData.croppedPreviewUrl || !currentSideData.croppedDimensions) return;

        try {
          const enhanced = await renderEnhancedFromUrl(
            currentSideData.croppedPreviewUrl,
            currentSideData.croppedDimensions.width,
            currentSideData.croppedDimensions.height,
            newSettings
          );

          if (enhancedUrlRef.current) {
            URL.revokeObjectURL(enhancedUrlRef.current);
          }
          enhancedUrlRef.current = enhanced.previewUrl;

          setSide((prev) => ({
            ...prev,
            enhancedPreviewUrl: enhanced.previewUrl,
            enhancedBlob: enhanced.blob,
          }));
        } catch (err) {
          console.error(`Batch enhancement render error for ${side}:`, err);
        }
      }, 0);
    },
    []
  );

  /**
   * Resets enhancements for a single side back to factory defaults.
   * Strictly isolated: affects ONLY the specified side, never the other side.
   */
  const resetSideEnhancements = useCallback((side: DocumentSide) => {
    const isTargetFront = side === "front";
    const setSide = isTargetFront ? setFront : setBack;
    const timerRef = isTargetFront ? frontEnhanceTimerRef : backEnhanceTimerRef;
    const enhancedUrlRef = isTargetFront ? frontEnhancedUrlRef : backEnhancedUrlRef;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (enhancedUrlRef.current) {
      URL.revokeObjectURL(enhancedUrlRef.current);
      enhancedUrlRef.current = null;
    }

    setSide((prev) => ({
      ...prev,
      enhancements: createDefaultEnhancementSettings(),
      enhancedPreviewUrl: null,
      enhancedBlob: null,
      showBefore: false,
    }));
  }, []);

  /**
   * Toggles Before / After comparison view for a side.
   */
  const toggleSideBeforeAfter = useCallback((side: DocumentSide) => {
    const setSide = side === "front" ? setFront : setBack;
    setSide((prev) => ({
      ...prev,
      showBefore: !prev.showBefore,
    }));
  }, []);

  /**
   * Sets Before / After view state explicitly for a side.
   */
  const setSideBeforeAfter = useCallback((side: DocumentSide, showBefore: boolean) => {
    const setSide = side === "front" ? setFront : setBack;
    setSide((prev) => ({
      ...prev,
      showBefore,
    }));
  }, []);

  /**
   * Downloads a single side's cropped card as an ISO/IEC 7810 ID-1 (CR80) standard PNG.
   * If enhancements are active and not in Before mode, exports the enhanced image.
   */
  const downloadSideCrop = useCallback(
    (side: DocumentSide) => {
      const targetSide = side === "front" ? frontRef.current : backRef.current;
      const isEnhanced =
        !targetSide.showBefore &&
        Boolean(targetSide.enhancedPreviewUrl) &&
        isEnhancementActive(targetSide.enhancements);

      const downloadUrl = isEnhanced
        ? targetSide.enhancedPreviewUrl
        : targetSide.croppedPreviewUrl ||
          (targetSide.croppedBlob ? URL.createObjectURL(targetSide.croppedBlob) : null);

      if (!downloadUrl) return;

      const docName = selectedDocType;
      const suffix = isEnhanced ? "-enhanced-cr80.png" : "-cr80.png";
      const filename = `${docName}-${side}${suffix}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [selectedDocType]
  );

  /**
   * Completely resets the Document Studio and revokes all active object URLs.
   */
  const clearAll = useCallback(() => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
      sourceUrlRef.current = null;
    }
    if (frontCroppedUrlRef.current) {
      URL.revokeObjectURL(frontCroppedUrlRef.current);
      frontCroppedUrlRef.current = null;
    }
    if (backCroppedUrlRef.current) {
      URL.revokeObjectURL(backCroppedUrlRef.current);
      backCroppedUrlRef.current = null;
    }
    if (frontEnhancedUrlRef.current) {
      URL.revokeObjectURL(frontEnhancedUrlRef.current);
      frontEnhancedUrlRef.current = null;
    }
    if (backEnhancedUrlRef.current) {
      URL.revokeObjectURL(backEnhancedUrlRef.current);
      backEnhancedUrlRef.current = null;
    }
    if (frontEnhanceTimerRef.current) {
      clearTimeout(frontEnhanceTimerRef.current);
      frontEnhanceTimerRef.current = null;
    }
    if (backEnhanceTimerRef.current) {
      clearTimeout(backEnhanceTimerRef.current);
      backEnhanceTimerRef.current = null;
    }
    initialFrontCropRef.current = null;
    initialBackCropRef.current = null;
    vectorInfoRef.current = null;
    setSource(createEmptySource());
    setFront(createEmptySideResult(targetAspect, selectedDocType));
    setBack(createEmptySideResult(targetAspect, selectedDocType));
    setAutoDetectStatus({ status: "idle" });
  }, [targetAspect, selectedDocType]);

  /**
   * Phase 08D — Document Print Quality & Dimensions Settings
   * Updates print settings (DPI, Presets, Width, Height, Aspect Ratio, Units) for a specific side.
   */
  const setSidePrintSettings = useCallback(
    (side: DocumentSide, updates: Partial<DocumentPrintSettings>) => {
      const isTargetFront = side === "front";
      const targetSide = isTargetFront ? frontRef.current : backRef.current;
      const setSide = isTargetFront ? setFront : setBack;
      const dimensions = targetSide.croppedDimensions || source.dimensions;

      setSide((prev) => ({
        ...prev,
        printSettings: updatePrintSettings(prev.printSettings, updates, dimensions),
      }));
    },
    [source.dimensions]
  );

  /**
   * Updates print settings for both Front and Back sides simultaneously.
   */
  const setAllPrintSettings = useCallback(
    (updates: Partial<DocumentPrintSettings>) => {
      const frontDims = frontRef.current.croppedDimensions || source.dimensions;
      const backDims = backRef.current.croppedDimensions || source.dimensions;

      setFront((prev) => ({
        ...prev,
        printSettings: updatePrintSettings(prev.printSettings, updates, frontDims),
      }));
      setBack((prev) => ({
        ...prev,
        printSettings: updatePrintSettings(prev.printSettings, updates, backDims),
      }));
    },
    [source.dimensions]
  );

  const hasAnyFile = Boolean(source.file && source.previewUrl);

  return {
    state: {
      selectedDocType,
      customSidesMode,
      sourceLayoutMode,
      source,
      front,
      back,
      autoDetectStatus,
      printSettings: front.printSettings,
    } as DocumentStudioState,
    currentDocDef,
    availableSides,
    hasAnyFile,
    isSingleSided,
    sourceLayoutMode,
    setDocumentType,
    setCustomSidesMode,
    setSourceLayoutMode,
    uploadDocumentFile,
    changePdfPage,
    openCropEditor,
    closeCropEditor,
    setSideCrop,
    setSideRotation,
    setSideZoom,
    setSideAspectRatioLocked,
    toggleSideActiveView,
    rotateSide,
    zoomSide,
    applyCrop,
    runAutoDetection,
    applySplitLayout,
    resetCrop,
    resetBothCrops,
    downloadSideCrop,
    setSideEnhancement,
    setSideEnhancements,
    resetSideEnhancements,
    toggleSideBeforeAfter,
    setSideBeforeAfter,
    setSidePrintSettings,
    setAllPrintSettings,
    clearAll,
  };
}
