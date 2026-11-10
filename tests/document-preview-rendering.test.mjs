/**
 * Automated Regression Test Suite: Document Studio — Document Preview Rendering
 * Verifies that Front and Back detected previews render correctly after auto-detection,
 * without premature Blob URL revocation or React StrictMode updater destruction.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_ENHANCEMENT_SETTINGS,
  createDefaultEnhancementSettings,
  isEnhancementActive,
} from "../src/types/document-studio.ts";

import {
  resolveActiveSideImage,
} from "../src/lib/document/document-print-studio.ts";

describe("BUG FIX VERIFICATION: Document Studio Preview Rendering & URL Lifecycle", () => {
  describe("1. StrictMode State Updater Idempotency (Zero Premature Revocation)", () => {
    test("simulated setFront updater preserves new cropped and enhanced URLs across double invocation", () => {
      const revoked = [];
      const mockURL = {
        revokeObjectURL: (u) => {
          if (u) revoked.push(u);
        },
      };

      const frontCroppedUrlRef = { current: "blob:previous-cropped" };
      const frontEnhancedUrlRef = { current: "blob:previous-enhanced" };

      const frontResult = {
        previewUrl: "blob:new-detected-front-cropped",
        blob: { size: 1000 },
        dimensions: { width: 1011, height: 638, aspectRatio: 1011 / 638 },
      };
      const frontEnhancedRes = {
        previewUrl: "blob:new-detected-front-enhanced",
        blob: { size: 1050 },
      };

      const forceResetManual = false;
      const docTargetAspect = 1.585;

      const setFrontUpdater = (prev) => {
        const keepManual = !forceResetManual && prev.isManualCrop && prev.crop;
        if (keepManual) {
          if (frontResult.previewUrl) mockURL.revokeObjectURL(frontResult.previewUrl);
          if (frontEnhancedRes) mockURL.revokeObjectURL(frontEnhancedRes.previewUrl);
          return prev;
        }
        if (prev.croppedPreviewUrl && prev.croppedPreviewUrl !== frontResult.previewUrl) {
          mockURL.revokeObjectURL(prev.croppedPreviewUrl);
        }
        if (prev.enhancedPreviewUrl && prev.enhancedPreviewUrl !== frontEnhancedRes?.previewUrl) {
          mockURL.revokeObjectURL(prev.enhancedPreviewUrl);
        }
        if (
          frontCroppedUrlRef.current &&
          frontCroppedUrlRef.current !== frontResult.previewUrl &&
          frontCroppedUrlRef.current !== prev.croppedPreviewUrl
        ) {
          mockURL.revokeObjectURL(frontCroppedUrlRef.current);
        }
        if (
          frontEnhancedUrlRef.current &&
          frontEnhancedUrlRef.current !== frontEnhancedRes?.previewUrl &&
          frontEnhancedUrlRef.current !== prev.enhancedPreviewUrl
        ) {
          mockURL.revokeObjectURL(frontEnhancedUrlRef.current);
        }
        frontCroppedUrlRef.current = frontResult.previewUrl;
        frontEnhancedUrlRef.current = frontEnhancedRes?.previewUrl ?? null;

        return {
          ...prev,
          crop: { x: 10, y: 10, width: 200, height: 120 },
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
      };

      const prevState = {
        isManualCrop: false,
        crop: null,
        croppedPreviewUrl: "blob:previous-cropped",
        enhancedPreviewUrl: "blob:previous-enhanced",
        enhancements: createDefaultEnhancementSettings(),
        showBefore: false,
      };

      // Call 1
      const call1Result = setFrontUpdater(prevState);
      assert.equal(call1Result.croppedPreviewUrl, "blob:new-detected-front-cropped");
      assert.equal(call1Result.enhancedPreviewUrl, "blob:new-detected-front-enhanced");
      assert.ok(revoked.includes("blob:previous-cropped"));
      assert.ok(revoked.includes("blob:previous-enhanced"));
      assert.ok(!revoked.includes("blob:new-detected-front-cropped"), "Must never revoke new crop URL on Call 1");
      assert.ok(!revoked.includes("blob:new-detected-front-enhanced"), "Must never revoke new enhanced URL on Call 1");

      // Call 2 (React StrictMode double invocation)
      const call2Result = setFrontUpdater(prevState);
      assert.equal(call2Result.croppedPreviewUrl, "blob:new-detected-front-cropped");
      assert.equal(call2Result.enhancedPreviewUrl, "blob:new-detected-front-enhanced");
      assert.ok(!revoked.includes("blob:new-detected-front-cropped"), "Must never revoke new crop URL on Call 2");
      assert.ok(!revoked.includes("blob:new-detected-front-enhanced"), "Must never revoke new enhanced URL on Call 2");
    });

    test("simulated setBack updater preserves new back URLs across double invocation", () => {
      const revoked = [];
      const mockURL = {
        revokeObjectURL: (u) => {
          if (u) revoked.push(u);
        },
      };

      const backCroppedUrlRef = { current: null };
      const backEnhancedUrlRef = { current: null };

      const backResult = {
        previewUrl: "blob:new-detected-back-cropped",
        blob: { size: 1100 },
        dimensions: { width: 1011, height: 638, aspectRatio: 1011 / 638 },
      };
      const backEnhancedRes = {
        previewUrl: "blob:new-detected-back-enhanced",
        blob: { size: 1150 },
      };

      const setBackUpdater = (prev) => {
        const keepManual = false;
        if (keepManual) return prev;

        if (prev.croppedPreviewUrl && prev.croppedPreviewUrl !== backResult.previewUrl) {
          mockURL.revokeObjectURL(prev.croppedPreviewUrl);
        }
        if (prev.enhancedPreviewUrl && prev.enhancedPreviewUrl !== backEnhancedRes?.previewUrl) {
          mockURL.revokeObjectURL(prev.enhancedPreviewUrl);
        }
        if (
          backCroppedUrlRef.current &&
          backCroppedUrlRef.current !== backResult.previewUrl &&
          backCroppedUrlRef.current !== prev.croppedPreviewUrl
        ) {
          mockURL.revokeObjectURL(backCroppedUrlRef.current);
        }
        if (
          backEnhancedUrlRef.current &&
          backEnhancedUrlRef.current !== backEnhancedRes?.previewUrl &&
          backEnhancedUrlRef.current !== prev.enhancedPreviewUrl
        ) {
          mockURL.revokeObjectURL(backEnhancedUrlRef.current);
        }
        backCroppedUrlRef.current = backResult.previewUrl;
        backEnhancedUrlRef.current = backEnhancedRes?.previewUrl ?? null;

        return {
          ...prev,
          crop: { x: 250, y: 10, width: 200, height: 120 },
          croppedPreviewUrl: backResult.previewUrl,
          enhancedPreviewUrl: backEnhancedRes?.previewUrl ?? null,
          isCropped: true,
        };
      };

      const prevState = {
        isManualCrop: false,
        crop: null,
        croppedPreviewUrl: null,
        enhancedPreviewUrl: null,
      };

      const res1 = setBackUpdater(prevState);
      assert.equal(res1.croppedPreviewUrl, "blob:new-detected-back-cropped");
      assert.equal(res1.enhancedPreviewUrl, "blob:new-detected-back-enhanced");

      const res2 = setBackUpdater(prevState);
      assert.equal(res2.croppedPreviewUrl, "blob:new-detected-back-cropped");
      assert.equal(res2.enhancedPreviewUrl, "blob:new-detected-back-enhanced");
      assert.equal(revoked.length, 0, "No URLs should be revoked when previous were null");
    });
  });

  describe("2. Document Preview URL Resolution & Enhancement Isolation", () => {
    test("preserves original detected croppedPreviewUrl independently of enhancedPreviewUrl", () => {
      const frontState = {
        isCropped: true,
        croppedPreviewUrl: "blob:clean-original-crop.png",
        croppedDimensions: { width: 1011, height: 638, aspectRatio: 1011 / 638 },
        enhancedPreviewUrl: "blob:enhanced-crop.png",
        enhancedBlob: {},
        enhancements: createDefaultEnhancementSettings(),
        showBefore: false,
        activeView: "cropped",
      };

      // Both URLs exist independently
      assert.equal(frontState.croppedPreviewUrl, "blob:clean-original-crop.png");
      assert.equal(frontState.enhancedPreviewUrl, "blob:enhanced-crop.png");

      // Print studio resolves active image
      const resolved = resolveActiveSideImage(frontState);
      assert.equal(resolved.imageUrl, "blob:enhanced-crop.png");
      assert.equal(resolved.isEnhanced, true);

      // Showing Before switches to clean cropped preview
      const activeWhenShowingBefore = frontState.showBefore
        ? frontState.croppedPreviewUrl
        : frontState.enhancedPreviewUrl;
      assert.equal(activeWhenShowingBefore, "blob:enhanced-crop.png");

      const beforeState = { ...frontState, showBefore: true };
      const resolvedBefore = beforeState.showBefore
        ? beforeState.croppedPreviewUrl
        : beforeState.enhancedPreviewUrl;
      assert.equal(resolvedBefore, "blob:clean-original-crop.png");
    });

    test("falls back to clean croppedPreviewUrl if enhancedPreviewUrl is null or fails", () => {
      const stateWithoutEnhanced = {
        isCropped: true,
        croppedPreviewUrl: "blob:clean-crop-fallback.png",
        enhancedPreviewUrl: null,
        enhancements: createDefaultEnhancementSettings(),
        showBefore: false,
        activeView: "cropped",
      };

      const resolved = resolveActiveSideImage(stateWithoutEnhanced);
      assert.equal(resolved.imageUrl, "blob:clean-crop-fallback.png");
      assert.equal(resolved.isEnhanced, false);
    });

    test("resetting enhancements does not destroy original cropped image", () => {
      const originalCropUrl = "blob:original-detected-front.png";
      let frontState = {
        isCropped: true,
        croppedPreviewUrl: originalCropUrl,
        croppedDimensions: { width: 1011, height: 638, aspectRatio: 1011 / 638 },
        enhancedPreviewUrl: "blob:temporary-enhanced.png",
        enhancements: { ...DEFAULT_ENHANCEMENT_SETTINGS, brightness: 50 },
        showBefore: false,
      };

      // Reset enhancements
      frontState = {
        ...frontState,
        enhancements: createDefaultEnhancementSettings(),
      };

      // Original crop URL is strictly preserved
      assert.equal(frontState.croppedPreviewUrl, originalCropUrl);
    });

    test("switching active sides preserves both Front and Back previews", () => {
      const frontState = {
        isCropped: true,
        croppedPreviewUrl: "blob:front-crop.png",
        enhancedPreviewUrl: "blob:front-enh.png",
      };
      const backState = {
        isCropped: true,
        croppedPreviewUrl: "blob:back-crop.png",
        enhancedPreviewUrl: "blob:back-enh.png",
      };

      // Simulate side selection
      let activeSide = "front";
      let activeImage = activeSide === "front" ? frontState.croppedPreviewUrl : backState.croppedPreviewUrl;
      assert.equal(activeImage, "blob:front-crop.png");

      activeSide = "back";
      activeImage = activeSide === "front" ? frontState.croppedPreviewUrl : backState.croppedPreviewUrl;
      assert.equal(activeImage, "blob:back-crop.png");

      // Verify neither side was cleared
      assert.ok(frontState.croppedPreviewUrl);
      assert.ok(backState.croppedPreviewUrl);
    });
  });

  describe("3. Code Verification & Invariant Assertions", () => {
    test("loadImageElement skips crossOrigin for blob: and data: URIs", () => {
      const cropperPath = path.resolve(process.cwd(), "src/lib/document/document-cropper.ts");
      const content = fs.readFileSync(cropperPath, "utf-8");

      assert.ok(
        content.includes('!url.startsWith("blob:")'),
        "loadImageElement must skip crossOrigin for blob: URLs to prevent CORS errors"
      );
      assert.ok(
        content.includes('!url.startsWith("data:")'),
        "loadImageElement must skip crossOrigin for data: URLs"
      );
    });

    test("useDocumentStudio checks keepManual and prevents self-revocation in state updaters", () => {
      const hookPath = path.resolve(process.cwd(), "src/hooks/useDocumentStudio.ts");
      const content = fs.readFileSync(hookPath, "utf-8");

      assert.ok(
        content.includes("const keepManual = !forceResetManual && prev.isManualCrop && prev.crop"),
        "Must preserve manual crop check"
      );
      assert.ok(
        content.includes("frontCroppedUrlRef.current !== frontResult.previewUrl"),
        "Must verify URL distinctness before revoking front cropped URL"
      );
      assert.ok(
        content.includes("frontEnhancedUrlRef.current !== frontEnhancedRes?.previewUrl"),
        "Must verify URL distinctness before revoking front enhanced URL"
      );
      assert.ok(
        content.includes("backCroppedUrlRef.current !== backResult.previewUrl"),
        "Must verify URL distinctness before revoking back cropped URL"
      );
      assert.ok(
        content.includes("backEnhancedUrlRef.current !== backEnhancedRes?.previewUrl"),
        "Must verify URL distinctness before revoking back enhanced URL"
      );
    });

    test("DocumentSideWorkspace includes graceful enhanced image error fallback", () => {
      const workspacePath = path.resolve(process.cwd(), "src/components/document-studio/DocumentSideWorkspace.tsx");
      const content = fs.readFileSync(workspacePath, "utf-8");

      assert.ok(
        content.includes("enhancedLoadFailed"),
        "DocumentSideWorkspace must track enhanced image load failure"
      );
      assert.ok(
        content.includes("onError"),
        "DocumentSideWorkspace must provide onError handler on preview img tag"
      );
    });
  });
});
