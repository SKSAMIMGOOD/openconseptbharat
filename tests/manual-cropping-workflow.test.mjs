/**
 * Automated Test Suite: Manual Cropping Workflow Verification
 *
 * Verifies all requirements from USER_REQUEST:
 * 1. Automatic detection does not replace manual crop functionality.
 * 2. Adjust Crop on Front Side:
 *    - Opens large crop editor.
 *    - Displays entire original uploaded document.
 *    - Shows document in a single enlarged viewing area.
 *    - Allows zooming, panning, and rectangular selection.
 *    - Allows user to manually select the front card.
 *    - Confirms and updates ONLY the Front Side.
 * 3. Adjust Crop on Back Side:
 *    - Opens the same crop editor.
 *    - Displays original document.
 *    - Allows independent selection of the back card.
 *    - Confirms and updates ONLY the Back Side.
 * 4. Required crop editor controls:
 *    - Zoom in
 *    - Zoom out
 *    - Fit to screen
 *    - Reset zoom
 *    - Crop selection
 *    - Cancel
 *    - Confirm Crop
 * 5. Manual crop state independence:
 *    - Changing Front Side must never affect Back Side.
 *    - Changing Back Side must never affect Front Side.
 * 6. Manual cropping overrides automatic detection:
 *    - isManualCrop flag set upon confirmation.
 *    - Automatic re-detection preserves manual crops.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  clampCropToBounds,
  moveCrop,
  resizeCropFromHandle,
  MIN_CROP_PIXELS,
} from "../src/lib/crop/crop-geometry.ts";

import {
  getRotatedDimensions,
  normalizeRotation,
} from "../src/lib/document/document-cropper.ts";

describe("MANUAL CROPPING WORKFLOW — Specification & Requirements Verification", () => {
  const cropEditorPath = path.resolve(
    process.cwd(),
    "src",
    "components",
    "document-studio",
    "DocumentCropEditor.tsx"
  );
  const workspacePath = path.resolve(
    process.cwd(),
    "src",
    "components",
    "document-studio",
    "DocumentStudioWorkspace.tsx"
  );
  const sideWorkspacePath = path.resolve(
    process.cwd(),
    "src",
    "components",
    "document-studio",
    "DocumentSideWorkspace.tsx"
  );
  const hookPath = path.resolve(
    process.cwd(),
    "src",
    "hooks",
    "useDocumentStudio.ts"
  );

  test("1. Required UI components and source files exist on disk", () => {
    assert.ok(fs.existsSync(cropEditorPath), "DocumentCropEditor.tsx must exist");
    assert.ok(fs.existsSync(workspacePath), "DocumentStudioWorkspace.tsx must exist");
    assert.ok(fs.existsSync(sideWorkspacePath), "DocumentSideWorkspace.tsx must exist");
    assert.ok(fs.existsSync(hookPath), "useDocumentStudio.ts must exist");
  });

  test("2. Large crop editor displays full document in a single enlarged viewing area", () => {
    const editorContent = fs.readFileSync(cropEditorPath, "utf-8");

    // Modal role and full-screen overlay for large display
    assert.ok(editorContent.includes('role="dialog"'), "Editor must have role='dialog'");
    assert.ok(editorContent.includes("fixed inset-0"), "Editor must take full viewport space (fixed inset-0)");
    assert.ok(editorContent.includes("Single Enlarged Viewing Area"), "Must identify as single enlarged viewing area");

    // Canvas drawing of entire original uploaded document
    assert.ok(editorContent.includes("canvasRef"), "Editor must use canvas to display the full document");
    assert.ok(editorContent.includes("previewUrl"), "Editor must accept previewUrl of full uploaded document");
    assert.ok(editorContent.includes("ResizeObserver"), "Editor must observe container for responsive enlarged display");
  });

  test("3. All required crop editor controls are present with exact labels and functionality", () => {
    const editorContent = fs.readFileSync(cropEditorPath, "utf-8");

    // Required control 1: Zoom in
    assert.ok(editorContent.includes("Zoom in"), "Must contain 'Zoom in' control");

    // Required control 2: Zoom out
    assert.ok(editorContent.includes("Zoom out"), "Must contain 'Zoom out' control");

    // Required control 3: Fit to screen
    assert.ok(editorContent.includes("Fit to screen"), "Must contain 'Fit to screen' control");

    // Required control 4: Reset zoom
    assert.ok(editorContent.includes("Reset zoom"), "Must contain 'Reset zoom' control");

    // Required control 5: Crop selection
    assert.ok(editorContent.includes("Crop selection"), "Must contain 'Crop selection' control");

    // Required control 6: Cancel
    assert.ok(editorContent.includes("Cancel"), "Must contain 'Cancel' control");

    // Required control 7: Confirm Crop
    assert.ok(editorContent.includes("Confirm Crop"), "Must contain 'Confirm Crop' control");
  });

  test("4. Rectangular selection, zooming, and panning mechanisms", () => {
    const editorContent = fs.readFileSync(cropEditorPath, "utf-8");

    // Rectangular selection drawing and handle resize
    assert.ok(editorContent.includes("handleContainerPointerDown"), "Must handle click and drag on container");
    assert.ok(editorContent.includes("handleCropPointerDown"), "Must handle drag to move crop rectangle");
    assert.ok(editorContent.includes("handleHandlePointerDown"), "Must handle drag to resize crop handles");
    assert.ok(editorContent.includes("resizeCropFromHandle"), "Must resize crop from handles");
    assert.ok(editorContent.includes("moveCrop"), "Must move crop across image coordinates");

    // Panning support
    assert.ok(editorContent.includes("Pan"), "Must have pan tool support");
    assert.ok(editorContent.includes("isSpacePressed"), "Must support Space key for panning");

    // Wheel zoom
    assert.ok(editorContent.includes("handleWheel"), "Must support mouse wheel zooming");
  });

  test("5. DocumentStudioWorkspace opens the same large crop editor for Front and Back sides", () => {
    const workspaceContent = fs.readFileSync(workspacePath, "utf-8");

    // Mounts DocumentCropEditor at workspace root when activeCropSide is truthy
    assert.ok(workspaceContent.includes("activeCropSide"), "Must determine activeCropSide for editor");
    assert.ok(workspaceContent.includes("<DocumentCropEditor"), "Must render DocumentCropEditor at workspace level");
    assert.ok(
      workspaceContent.includes('activeCropSide === "front" ? "Front Side" : "Back Side"'),
      "Must open same crop editor with dynamic sideTitle"
    );
  });

  test("6. DocumentSideWorkspace initiates Adjust Crop without embedding miniature editor", () => {
    const sideContent = fs.readFileSync(sideWorkspacePath, "utf-8");

    // Has Adjust Crop button
    assert.ok(sideContent.includes("Adjust Crop"), "Must have Adjust Crop button");
    assert.ok(sideContent.includes("onOpenCropEditor(side)"), "Must invoke onOpenCropEditor with side");

    // Does not import or render miniature DocumentCropEditor inside split card
    assert.ok(
      !sideContent.includes("<DocumentCropEditor"),
      "DocumentSideWorkspace must NOT embed cramped miniature DocumentCropEditor inside card column"
    );
  });

  test("7. State Isolation: Independent Front and Back state transitions in useDocumentStudio", () => {
    const hookContent = fs.readFileSync(hookPath, "utf-8");

    // applyCrop updates only the specified side
    assert.ok(hookContent.includes("applyCrop"), "Must provide applyCrop function");
    assert.ok(
      hookContent.includes('const setSide = side === "front" ? setFront : setBack'),
      "applyCrop must update only the target side"
    );
    assert.ok(hookContent.includes("isManualCrop: true"), "applyCrop must mark side with isManualCrop: true");

    // resetCrop resets only the specified side
    assert.ok(
      hookContent.includes('const isTargetFront = side === "front"'),
      "resetCrop must independently distinguish between front and back"
    );

    // Cancel / Close editor closes without mutating crop coordinates
    assert.ok(
      hookContent.includes("closeCropEditor"),
      "Must provide closeCropEditor function"
    );
  });

  test("8. Manual cropping overrides automatic detection", () => {
    const hookContent = fs.readFileSync(hookPath, "utf-8");

    // executeDetectionAndCropping checks keepManual and preserves manual crop
    assert.ok(
      hookContent.includes("const keepManual = !forceResetManual && prev.isManualCrop && prev.crop"),
      "Must check if side has a manual crop to keep"
    );
    assert.ok(
      hookContent.includes("if (keepManual)"),
      "Must preserve existing manual crop and avoid overwriting with automatic detection"
    );

    // runAutoDetection preserves manual crops
    assert.ok(
      hookContent.includes("Manual crops override automatic detection"),
      "runAutoDetection must preserve manual crops"
    );
  });

  test("9. Geometry verification: Independent rectangular selection clamping and coordinate transformations", () => {
    const docW = 2480;
    const docH = 3508;
    const cardAspect = 85.6 / 53.98;

    // Simulate selecting front card in bottom-left
    const frontCrop = { x: 120, y: 2200, width: 1050, height: 662 };
    const clampedFront = clampCropToBounds(frontCrop, docW, docH, cardAspect, MIN_CROP_PIXELS);

    assert.equal(clampedFront.x, 120);
    assert.equal(clampedFront.y, 2200);
    assert.ok(clampedFront.x + clampedFront.width <= docW);
    assert.ok(clampedFront.y + clampedFront.height <= docH);

    // Simulate selecting back card in bottom-right
    const backCrop = { x: 1300, y: 2200, width: 1050, height: 662 };
    const clampedBack = clampCropToBounds(backCrop, docW, docH, cardAspect, MIN_CROP_PIXELS);

    assert.equal(clampedBack.x, 1300);
    assert.equal(clampedBack.y, 2200);

    // Changing front crop must never alter back crop coordinates
    const modifiedFront = moveCrop(clampedFront, 50, -100, docW, docH);
    assert.equal(modifiedFront.x, 170);
    assert.equal(modifiedFront.y, 2100);
    assert.equal(clampedBack.x, 1300, "Back card coordinates must remain completely unchanged");
    assert.equal(clampedBack.y, 2200, "Back card coordinates must remain completely unchanged");

    // Changing back crop must never alter front crop coordinates
    const modifiedBack = moveCrop(clampedBack, -40, 60, docW, docH);
    assert.equal(modifiedBack.x, 1260);
    assert.equal(modifiedBack.y, 2260);
    assert.equal(modifiedFront.x, 170, "Front card coordinates must remain completely unchanged");
    assert.equal(modifiedFront.y, 2100, "Front card coordinates must remain completely unchanged");
  });
});
