/**
 * Raw Image to Clean PDF — useRawImageToPdf Hook
 * Phase 1: Foundation & Multi-Image Upload
 * Phase 2: Decoupled Multi-Page Perspective Cropper & Loupe
 * Phase 3: Document Enhancement & Annotation Tools
 *
 * Implements independent, memory-conscious multi-page state management:
 * - Sequentially processes and generates lightweight thumbnails
 * - Strictly enforces configurable batch size (default 5 images)
 * - Safely manages and revokes tracked Object URLs (thumbnails, cropped, edited previews)
 * - Supports reordering, replacing, deleting, and adding pages
 * - Manages independent 4-corner perspective crop configurations per page
 * - Manages global document enhancement settings across all pages
 * - Manages page-specific pixel-retouching eraser, highlighter, watermark, and undo/redo stacks
 * - Fully isolated from existing Document Straightener & Photo Studio states
 */

"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type {
  RawDocumentPage,
  RawImageToPdfConfig,
  BatchUploadResult,
  PerspectiveQuad,
  AspectRatioPreset,
  DocumentEnhancementSettings,
  AnnotationStroke,
  WatermarkConfig,
  ColorFilterSettings,
  WorkflowStep,
} from "@/types/raw-image-to-pdf";
import {
  DEFAULT_RAW_IMAGE_CONFIG,
  DEFAULT_ENHANCEMENT_SETTINGS,
  DEFAULT_COLOR_FILTER_SETTINGS,
} from "@/types/raw-image-to-pdf";
import { validateFile, verifyFileMagicBytes } from "@/lib/validation/file-validator";
import { generateLightweightThumbnail } from "@/lib/raw-image-to-pdf/thumbnail-generator";
import { revokeObjectUrlSafely } from "@/lib/utils/memory";

export function useRawImageToPdf(config: Partial<RawImageToPdfConfig> = {}) {
  const {
    maxBatchSize,
    maxFileSizeMB,
    allowedMimeTypes,
    thumbnailMaxDimension,
    thumbnailQuality,
  } = config;

  const mergedConfig = useMemo<RawImageToPdfConfig>(
    () => ({
      ...DEFAULT_RAW_IMAGE_CONFIG,
      ...(maxBatchSize !== undefined ? { maxBatchSize } : {}),
      ...(maxFileSizeMB !== undefined ? { maxFileSizeMB } : {}),
      ...(allowedMimeTypes !== undefined ? { allowedMimeTypes } : {}),
      ...(thumbnailMaxDimension !== undefined ? { thumbnailMaxDimension } : {}),
      ...(thumbnailQuality !== undefined ? { thumbnailQuality } : {}),
    }),
    [
      maxBatchSize,
      maxFileSizeMB,
      allowedMimeTypes,
      thumbnailMaxDimension,
      thumbnailQuality,
    ]
  );

  const [pages, setPages] = useState<RawDocumentPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Workflow State: Upload -> Crop All Pages -> Final Editing Workspace -> Download PDF
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>("upload");

  // Track if all uploaded pages have either been cropped or confirmed original
  const allPagesCropCompleted = useMemo(() => {
    return pages.length > 0 && pages.every((p) => Boolean(p.isCropped || p.cropConfirmed));
  }, [pages]);

  // Phase 2: Cropping Modal & Active Page Index
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropActivePageIndex, setCropActivePageIndex] = useState<number>(0);

  // Phase 3: Global Enhancement Settings (applies across all pages)
  const [globalEnhancements, setGlobalEnhancements] = useState<DocumentEnhancementSettings>({
    ...DEFAULT_ENHANCEMENT_SETTINGS,
  });

  // Phase 3.1: Global Color Filter Settings (applies across all pages)
  const [globalColorFilter, setGlobalColorFilter] = useState<ColorFilterSettings>({
    ...DEFAULT_COLOR_FILTER_SETTINGS,
  });

  // Phase 3: Edit Studio Modal & Active Page Index
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editActivePageIndex, setEditActivePageIndex] = useState<number>(0);

  // Track all active Object URLs for guaranteed cleanup
  const activeThumbnailUrlsRef = useRef<Set<string>>(new Set());
  const activeCroppedUrlsRef = useRef<Set<string>>(new Set());
  const activeEditedUrlsRef = useRef<Set<string>>(new Set());

  const registerThumbnailUrl = useCallback((url: string) => {
    if (url && url.startsWith("blob:")) {
      activeThumbnailUrlsRef.current.add(url);
    }
  }, []);

  const releaseThumbnailUrl = useCallback((url: string | null | undefined) => {
    if (url && url.startsWith("blob:")) {
      activeThumbnailUrlsRef.current.delete(url);
      revokeObjectUrlSafely(url);
    }
  }, []);

  const registerCroppedUrl = useCallback((url: string) => {
    if (url && url.startsWith("blob:")) {
      activeCroppedUrlsRef.current.add(url);
    }
  }, []);

  const releaseCroppedUrl = useCallback((url: string | null | undefined) => {
    if (url && url.startsWith("blob:")) {
      activeCroppedUrlsRef.current.delete(url);
      revokeObjectUrlSafely(url);
    }
  }, []);

  const registerEditedUrl = useCallback((url: string) => {
    if (url && url.startsWith("blob:")) {
      activeEditedUrlsRef.current.add(url);
    }
  }, []);

  const releaseEditedUrl = useCallback((url: string | null | undefined) => {
    if (url && url.startsWith("blob:")) {
      activeEditedUrlsRef.current.delete(url);
      revokeObjectUrlSafely(url);
    }
  }, []);

  // Cleanup all URLs on unmount
  useEffect(() => {
    const thumbUrls = activeThumbnailUrlsRef.current;
    const croppedUrls = activeCroppedUrlsRef.current;
    const editedUrls = activeEditedUrlsRef.current;
    return () => {
      thumbUrls.forEach((url) => revokeObjectUrlSafely(url));
      thumbUrls.clear();

      croppedUrls.forEach((url) => revokeObjectUrlSafely(url));
      croppedUrls.clear();

      editedUrls.forEach((url) => revokeObjectUrlSafely(url));
      editedUrls.clear();
    };
  }, []);

  /**
   * Adds multiple image files into the workspace.
   */
  const addImages = useCallback(
    async (fileList: File[] | FileList): Promise<BatchUploadResult> => {
      const files = Array.from(fileList);
      if (files.length === 0) {
        return { addedPages: [], rejectedCount: 0, errors: [] };
      }

      setIsProcessing(true);
      const errors: string[] = [];
      const newPages: RawDocumentPage[] = [];

      const currentCount = pages.length;
      const remainingCapacity = Math.max(0, mergedConfig.maxBatchSize - currentCount);

      if (remainingCapacity <= 0) {
        const errorMsg = `Batch limit reached. Maximum ${mergedConfig.maxBatchSize} images allowed per document.`;
        setValidationErrors([errorMsg]);
        setStatusMessage(null);
        setIsProcessing(false);
        return { addedPages: [], rejectedCount: files.length, errors: [errorMsg] };
      }

      let candidateFiles = files;
      let rejectedDueToCapacity = 0;

      if (files.length > remainingCapacity) {
        rejectedDueToCapacity = files.length - remainingCapacity;
        candidateFiles = files.slice(0, remainingCapacity);
        errors.push(
          `Added ${remainingCapacity} of ${files.length} images. Maximum batch limit is ${mergedConfig.maxBatchSize} images.`
        );
      }

      for (let i = 0; i < candidateFiles.length; i++) {
        const file = candidateFiles[i];
        setStatusMessage(`Analyzing and optimizing image ${i + 1} of ${candidateFiles.length} (${file.name})...`);

        const validation = validateFile(file, {
          maxSizeMB: mergedConfig.maxFileSizeMB,
          allowedMimeTypes: mergedConfig.allowedMimeTypes,
        });

        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        const isMagicValid = await verifyFileMagicBytes(file);
        if (!isMagicValid) {
          errors.push(`${file.name}: File header signature is corrupted or not a valid image format.`);
          continue;
        }

        try {
          const thumbResult = await generateLightweightThumbnail(file, {
            thumbnailMaxDimension: mergedConfig.thumbnailMaxDimension,
            thumbnailQuality: mergedConfig.thumbnailQuality,
          });

          registerThumbnailUrl(thumbResult.thumbnailUrl);

          const newPage: RawDocumentPage = {
            id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            name: file.name,
            size: file.size,
            sizeFormatted: thumbResult.sizeFormatted,
            originalWidth: thumbResult.originalWidth,
            originalHeight: thumbResult.originalHeight,
            aspectRatio: thumbResult.aspectRatio,
            thumbnailUrl: thumbResult.thumbnailUrl,
            thumbnailBlob: thumbResult.thumbnailBlob,
            status: "ready",
            rotation: 0,
            isCropped: false,
            cropConfirmed: false,
            annotations: [],
            undoStack: [],
            watermark: null,
            applyGlobalEdits: true,
          };

          newPages.push(newPage);
        } catch (err: any) {
          errors.push(`${file.name}: ${err?.message || "Failed to decode image."}`);
        }
      }

      if (newPages.length > 0) {
        setPages((prev) => [...prev, ...newPages]);

        // Automatically open the perspective crop editor for the uploaded images (Step 2: Crop All Pages)
        const targetCropIndex = pages.length === 0 ? 0 : pages.length;
        setCropActivePageIndex(targetCropIndex);
        setIsCropModalOpen(true);
        setWorkflowStep("crop");
      }

      setValidationErrors(errors);
      setStatusMessage(null);
      setIsProcessing(false);

      return {
        addedPages: newPages,
        rejectedCount: errors.length + rejectedDueToCapacity,
        errors,
      };
    },
    [pages.length, mergedConfig, registerThumbnailUrl]
  );

  /**
   * Removes an individual page by ID and revokes all its associated preview URLs.
   */
  const removePage = useCallback(
    (id: string) => {
      setPages((prev) => {
        const targetPage = prev.find((p) => p.id === id);
        if (targetPage) {
          releaseThumbnailUrl(targetPage.thumbnailUrl);
          releaseCroppedUrl(targetPage.croppedPreviewUrl);
          releaseEditedUrl(targetPage.editedPreviewUrl);
        }
        const updated = prev.filter((p) => p.id !== id);

        if (updated.length === 0) {
          setWorkflowStep("upload");
        }

        setActivePageIndex((currIdx) => {
          if (updated.length === 0) return 0;
          if (currIdx >= updated.length) return updated.length - 1;
          return currIdx;
        });

        setCropActivePageIndex((currIdx) => {
          if (updated.length === 0) return 0;
          if (currIdx >= updated.length) return updated.length - 1;
          return currIdx;
        });

        setEditActivePageIndex((currIdx) => {
          if (updated.length === 0) return 0;
          if (currIdx >= updated.length) return updated.length - 1;
          return currIdx;
        });

        return updated;
      });
    },
    [releaseThumbnailUrl, releaseCroppedUrl, releaseEditedUrl]
  );

  /**
   * Replaces an existing page's source file and clears its cropped/edited previews.
   */
  const replacePage = useCallback(
    async (id: string, newFile: File) => {
      setIsProcessing(true);
      setStatusMessage(`Replacing page image with ${newFile.name}...`);

      const validation = validateFile(newFile, {
        maxSizeMB: mergedConfig.maxFileSizeMB,
        allowedMimeTypes: mergedConfig.allowedMimeTypes,
      });

      if (!validation.isValid) {
        setValidationErrors([`${newFile.name}: ${validation.error}`]);
        setIsProcessing(false);
        setStatusMessage(null);
        return;
      }

      const isMagicValid = await verifyFileMagicBytes(newFile);
      if (!isMagicValid) {
        setValidationErrors([`${newFile.name}: Invalid or corrupted image signature.`]);
        setIsProcessing(false);
        setStatusMessage(null);
        return;
      }

      try {
        const thumbResult = await generateLightweightThumbnail(newFile, {
          thumbnailMaxDimension: mergedConfig.thumbnailMaxDimension,
          thumbnailQuality: mergedConfig.thumbnailQuality,
        });

        registerThumbnailUrl(thumbResult.thumbnailUrl);

        setPages((prev) =>
          prev.map((page) => {
            if (page.id !== id) return page;

            releaseThumbnailUrl(page.thumbnailUrl);
            releaseCroppedUrl(page.croppedPreviewUrl);
            releaseEditedUrl(page.editedPreviewUrl);

            return {
              ...page,
              file: newFile,
              name: newFile.name,
              size: newFile.size,
              sizeFormatted: thumbResult.sizeFormatted,
              originalWidth: thumbResult.originalWidth,
              originalHeight: thumbResult.originalHeight,
              aspectRatio: thumbResult.aspectRatio,
              thumbnailUrl: thumbResult.thumbnailUrl,
              thumbnailBlob: thumbResult.thumbnailBlob,
              status: "ready",
              rotation: 0,
              isCropped: false,
              cropConfig: undefined,
              croppedPreviewUrl: undefined,
              croppedBlob: undefined,
              croppedWidth: undefined,
              croppedHeight: undefined,
              annotations: [],
              undoStack: [],
              watermark: null,
              editedPreviewUrl: undefined,
              editedBlob: undefined,
              applyGlobalEdits: page.applyGlobalEdits ?? true,
              error: undefined,
            };
          })
        );
      } catch (err: any) {
        setValidationErrors([`${newFile.name}: ${err?.message || "Failed to decode replacement image."}`]);
      } finally {
        setIsProcessing(false);
        setStatusMessage(null);
      }
    },
    [mergedConfig, registerThumbnailUrl, releaseThumbnailUrl, releaseCroppedUrl, releaseEditedUrl]
  );

  /**
   * Reorders a page from one index to another.
   */
  const reorderPage = useCallback((fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      const updated = [...prev];
      const [movedPage] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedPage);
      return updated;
    });

    setActivePageIndex(toIndex);
  }, []);

  const movePageLeft = useCallback(
    (index: number) => {
      if (index > 0) reorderPage(index, index - 1);
    },
    [reorderPage]
  );

  const movePageRight = useCallback(
    (index: number) => {
      if (index < pages.length - 1) reorderPage(index, index + 1);
    },
    [pages.length, reorderPage]
  );

  /**
   * Clears all pages and frees all tracked Object URLs from browser memory.
   */
  const clearAllPages = useCallback(() => {
    pages.forEach((page) => {
      releaseThumbnailUrl(page.thumbnailUrl);
      releaseCroppedUrl(page.croppedPreviewUrl);
      releaseEditedUrl(page.editedPreviewUrl);
    });
    setPages([]);
    setActivePageIndex(0);
    setCropActivePageIndex(0);
    setEditActivePageIndex(0);
    setIsCropModalOpen(false);
    setIsEditModalOpen(false);
    setWorkflowStep("upload");
    setValidationErrors([]);
    setStatusMessage(null);
    setGlobalEnhancements({ ...DEFAULT_ENHANCEMENT_SETTINGS });
  }, [pages, releaseThumbnailUrl, releaseCroppedUrl, releaseEditedUrl]);

  const clearErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  /**
   * Phase 2: Opens perspective crop editor modal for a specific page.
   */
  const openCropEditor = useCallback(
    (pageIndex?: number) => {
      if (pageIndex !== undefined && pageIndex >= 0 && pageIndex < pages.length) {
        setCropActivePageIndex(pageIndex);
      } else if (activePageIndex >= 0 && activePageIndex < pages.length) {
        setCropActivePageIndex(activePageIndex);
      } else {
        setCropActivePageIndex(0);
      }
      setWorkflowStep("crop");
      setIsCropModalOpen(true);
    },
    [pages.length, activePageIndex]
  );

  const closeCropEditor = useCallback(() => {
    setIsCropModalOpen(false);
    if (pages.length > 0 && pages.every((p) => p.isCropped || p.cropConfirmed)) {
      setWorkflowStep("edit");
    }
  }, [pages]);

  /**
   * Phase 2: Saves a page's perspective crop result.
   * If existing annotations exist, resets them to avoid misaligned coordinates.
   */
  const savePageCrop = useCallback(
    (
      pageId: string,
      cropResult: {
        quad: PerspectiveQuad;
        rotation: number;
        aspectRatioPreset: AspectRatioPreset;
        croppedBlob: Blob;
        croppedPreviewUrl: string;
        width: number;
        height: number;
      }
    ) => {
      registerCroppedUrl(cropResult.croppedPreviewUrl);

      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== pageId) return page;

          if (page.croppedPreviewUrl && page.croppedPreviewUrl !== cropResult.croppedPreviewUrl) {
            releaseCroppedUrl(page.croppedPreviewUrl);
          }
          if (page.editedPreviewUrl) {
            releaseEditedUrl(page.editedPreviewUrl);
          }

          return {
            ...page,
            isCropped: true,
            cropConfirmed: true,
            rotation: cropResult.rotation,
            cropConfig: {
              quad: cropResult.quad,
              rotation: cropResult.rotation,
              aspectRatioPreset: cropResult.aspectRatioPreset,
              appliedAt: Date.now(),
            },
            croppedPreviewUrl: cropResult.croppedPreviewUrl,
            croppedBlob: cropResult.croppedBlob,
            croppedWidth: cropResult.width,
            croppedHeight: cropResult.height,
            // Reset annotations when crop geometry changes to maintain coordinate integrity
            annotations: [],
            undoStack: [],
            editedPreviewUrl: undefined,
            editedBlob: undefined,
          };
        })
      );
    },
    [registerCroppedUrl, releaseCroppedUrl, releaseEditedUrl]
  );

  /**
   * Explicitly marks a page to use its original uncropped image, completing its crop decision.
   */
  const confirmPageOriginal = useCallback(
    (pageId: string) => {
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== pageId) return page;

          if (page.croppedPreviewUrl) releaseCroppedUrl(page.croppedPreviewUrl);
          if (page.editedPreviewUrl) releaseEditedUrl(page.editedPreviewUrl);

          return {
            ...page,
            isCropped: false,
            cropConfirmed: true,
            rotation: 0,
            cropConfig: undefined,
            croppedPreviewUrl: undefined,
            croppedBlob: undefined,
            croppedWidth: undefined,
            croppedHeight: undefined,
          };
        })
      );
    },
    [releaseCroppedUrl, releaseEditedUrl]
  );

  /**
   * Phase 2: Resets a page's crop back to its original raw image state.
   */
  const resetPageCrop = useCallback(
    (pageId: string) => {
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== pageId) return page;

          if (page.croppedPreviewUrl) releaseCroppedUrl(page.croppedPreviewUrl);
          if (page.editedPreviewUrl) releaseEditedUrl(page.editedPreviewUrl);

          return {
            ...page,
            isCropped: false,
            cropConfirmed: false,
            rotation: 0,
            cropConfig: undefined,
            croppedPreviewUrl: undefined,
            croppedBlob: undefined,
            croppedWidth: undefined,
            croppedHeight: undefined,
            annotations: [],
            undoStack: [],
            editedPreviewUrl: undefined,
            editedBlob: undefined,
          };
        })
      );
    },
    [releaseCroppedUrl, releaseEditedUrl]
  );

  /**
   * Transitions from Step 2 (Crop All Pages) to Step 3 (Final Editing Workspace).
   */
  const completeCropWorkflow = useCallback(() => {
    setIsCropModalOpen(false);
    setWorkflowStep("edit");
  }, []);

  // ==========================================
  // Phase 3: Global Enhancement Controls
  // ==========================================

  const updateGlobalEnhancement = useCallback(
    <K extends keyof DocumentEnhancementSettings>(key: K, value: DocumentEnhancementSettings[K]) => {
      setGlobalEnhancements((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const resetGlobalEnhancements = useCallback(() => {
    setGlobalEnhancements({ ...DEFAULT_ENHANCEMENT_SETTINGS });
  }, []);

  // ==========================================
  // Phase 3.1: Global Color Filter Controls
  // ==========================================

  const updateGlobalColorFilter = useCallback((filter: ColorFilterSettings) => {
    setGlobalColorFilter(filter);
  }, []);

  const resetGlobalColorFilter = useCallback(() => {
    setGlobalColorFilter({ ...DEFAULT_COLOR_FILTER_SETTINGS });
  }, []);

  /**
   * Phase 3.1: Sets or toggles per-page opt-in/opt-out for global enhancements and color filters.
   */
  const setPageApplyGlobalEdits = useCallback((pageId: string, applyGlobalEdits?: boolean) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const nextVal =
          applyGlobalEdits !== undefined ? applyGlobalEdits : !(page.applyGlobalEdits ?? true);
        return {
          ...page,
          applyGlobalEdits: nextVal,
        };
      })
    );
  }, []);

  // ==========================================
  // Phase 3: Page Annotation & Watermark State
  // ==========================================

  const addPageStroke = useCallback((pageId: string, stroke: AnnotationStroke) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const currentStrokes = page.annotations || [];
        return {
          ...page,
          annotations: [...currentStrokes, stroke],
          undoStack: [], // New stroke clears redo stack
        };
      })
    );
  }, []);

  const undoPageStroke = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const currentStrokes = page.annotations || [];
        if (currentStrokes.length === 0) return page;

        const updatedStrokes = [...currentStrokes];
        const poppedStroke = updatedStrokes.pop()!;
        const currentUndoStack = page.undoStack || [];

        return {
          ...page,
          annotations: updatedStrokes,
          undoStack: [...currentUndoStack, poppedStroke],
        };
      })
    );
  }, []);

  const redoPageStroke = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const currentUndoStack = page.undoStack || [];
        if (currentUndoStack.length === 0) return page;

        const updatedUndoStack = [...currentUndoStack];
        const restoredStroke = updatedUndoStack.pop()!;
        const currentStrokes = page.annotations || [];

        return {
          ...page,
          annotations: [...currentStrokes, restoredStroke],
          undoStack: updatedUndoStack,
        };
      })
    );
  }, []);

  const clearPageStrokes = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          annotations: [],
          undoStack: [],
        };
      })
    );
  }, []);

  const setPageWatermark = useCallback((pageId: string, watermark: WatermarkConfig | null) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          watermark,
        };
      })
    );
  }, []);

  // ==========================================
  // Phase 3: Edit Studio Modal State
  // ==========================================

  const openEditStudio = useCallback(
    (pageIndex?: number) => {
      if (pageIndex !== undefined && pageIndex >= 0 && pageIndex < pages.length) {
        setEditActivePageIndex(pageIndex);
      } else if (activePageIndex >= 0 && activePageIndex < pages.length) {
        setEditActivePageIndex(activePageIndex);
      } else {
        setEditActivePageIndex(0);
      }
      setIsEditModalOpen(true);
    },
    [pages.length, activePageIndex]
  );

  const closeEditStudio = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  return {
    pages,
    activePageIndex,
    activePage: pages[activePageIndex] || null,
    totalPages: pages.length,
    croppedPagesCount: pages.filter((p) => p.isCropped).length,
    annotatedPagesCount: pages.filter(
      (p) => (p.annotations && p.annotations.length > 0) || (p.watermark && p.watermark.enabled)
    ).length,
    maxBatchSize: mergedConfig.maxBatchSize,
    remainingCapacity: Math.max(0, mergedConfig.maxBatchSize - pages.length),
    isProcessing,
    statusMessage,
    validationErrors,
    // Gallery & Upload actions
    addImages,
    removePage,
    replacePage,
    reorderPage,
    movePageLeft,
    movePageRight,
    setActivePageIndex,
    clearAllPages,
    clearErrors,
    // Phase 2: Cropper state & actions
    isCropModalOpen,
    cropActivePageIndex,
    openCropEditor,
    closeCropEditor,
    setCropActivePageIndex,
    savePageCrop,
    resetPageCrop,
    confirmPageOriginal,
    // Workflow State: Upload -> Crop All Pages -> Final Editing Workspace -> Download PDF
    workflowStep,
    setWorkflowStep,
    allPagesCropCompleted,
    completeCropWorkflow,
    // Phase 3: Global Enhancement state & actions
    globalEnhancements,
    setGlobalEnhancements,
    updateGlobalEnhancement,
    resetGlobalEnhancements,
    // Phase 3.1: Global Color Filter state & actions
    globalColorFilter,
    setGlobalColorFilter,
    updateGlobalColorFilter,
    resetGlobalColorFilter,
    setPageApplyGlobalEdits,
    // Phase 3: Page Annotation actions
    addPageStroke,
    undoPageStroke,
    redoPageStroke,
    clearPageStrokes,
    setPageWatermark,
    // Phase 3: Edit Studio Modal state & actions
    isEditModalOpen,
    editActivePageIndex,
    openEditStudio,
    closeEditStudio,
    setEditActivePageIndex,
  };
}
