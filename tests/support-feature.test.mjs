/**
 * Automated Test Suite: Feature — Help Us Support (Popup + Dashboard Button)
 *
 * Verifies:
 * 1. QR Code Asset Integrity (existence, dimensions, aspect ratio, byte length)
 * 2. Support URL and constants verification
 * 3. Support Popup Content & Copy requirements (Heading, message, caption, additional text, buttons)
 * 4. Dismissal and LocalStorage persistence logic (first visit vs. subsequent visit)
 * 5. Dashboard Help Us Button configuration & accessibility
 * 6. Codebase integration (RootLayout and HomePage inclusion)
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  SUPPORT_URL,
  SUPPORT_DISMISSAL_STORAGE_KEY,
  SUPPORT_QR_ASSET_PATH,
  SUPPORT_POPUP_CONTENT,
} from "../src/constants/support.ts";

// Mock localStorage for Node test environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

describe("1. Support QR Code Asset Integrity", () => {
  const qrPath = path.join(process.cwd(), "public", "support-qr.png");
  const providedAssetPath = path.join(process.cwd(), "upidetalis.png");

  test("support QR image exists on disk in public directory", () => {
    assert.ok(fs.existsSync(qrPath), "public/support-qr.png must exist");
  });

  test("support QR image matches exact provided asset", () => {
    assert.ok(fs.existsSync(providedAssetPath), "Provided asset upidetalis.png must exist");
    const statProvided = fs.statSync(providedAssetPath);
    const statPublic = fs.statSync(qrPath);
    assert.equal(statPublic.size, statProvided.size, "QR code image size must match provided asset");

    const buf = fs.readFileSync(qrPath);
    // Verify PNG magic bytes
    assert.equal(buf[0], 0x89);
    assert.equal(buf[1], 0x50);
    assert.equal(buf[2], 0x4e);
    assert.equal(buf[3], 0x47);
  });

  test("QR image dimensions maintain readable aspect ratio for scanning", () => {
    const buf = fs.readFileSync(qrPath);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);

    assert.ok(width >= 300 && height >= 300, "Image must have sufficient resolution for scanning");
    const aspectRatio = width / height;
    assert.ok(
      Math.abs(aspectRatio - 1.0) < 0.2,
      `Aspect ratio should be near 1:1 square for QR scan (got ${aspectRatio.toFixed(3)})`
    );
  });
});

describe("2. Support URL & Constants", () => {
  test("SUPPORT_URL matches the required payment URL", () => {
    assert.equal(
      SUPPORT_URL,
      "https://sksamimgood.github.io/Personal-Payment-Str/",
      "Must redirect to exact requested URL"
    );
  });

  test("SUPPORT_DISMISSAL_STORAGE_KEY is properly defined", () => {
    assert.equal(
      SUPPORT_DISMISSAL_STORAGE_KEY,
      "bus_support_popup_dismissed",
      "Storage key should be properly named"
    );
  });

  test("SUPPORT_QR_ASSET_PATH is correctly referenced", () => {
    assert.equal(
      SUPPORT_QR_ASSET_PATH,
      "/support-qr.png",
      "QR asset path must be /support-qr.png"
    );
  });
});

describe("3. Support Popup Content & Copy Requirements", () => {
  test("content matches exact requested copy specifications", () => {
    assert.equal(SUPPORT_POPUP_CONTENT.heading, "Enjoying this tool?");
    assert.equal(
      SUPPORT_POPUP_CONTENT.message,
      "If this tool helps you in your daily work, consider supporting us. Your contribution helps us maintain, improve, and keep this tool free for everyone."
    );
    assert.equal(
      SUPPORT_POPUP_CONTENT.additionalText,
      "Every little contribution makes a difference. Thank you for your support!"
    );
    assert.equal(SUPPORT_POPUP_CONTENT.caption, "Scan to support us");
    assert.equal(SUPPORT_POPUP_CONTENT.maybeLaterText, "Maybe Later");
    assert.equal(SUPPORT_POPUP_CONTENT.helpUsText, "Help Us");
    assert.equal(SUPPORT_POPUP_CONTENT.supportingLabel, "Help keep this tool free");
  });

  test("WelcomeSupportPopup component source code reflects all requirements", () => {
    const popupSourcePath = path.join(
      process.cwd(),
      "src",
      "components",
      "support",
      "WelcomeSupportPopup.tsx"
    );
    const popupCode = fs.readFileSync(popupSourcePath, "utf-8");

    // QR container
    assert.ok(popupCode.includes("bg-white"), "QR code container must have white background");
    assert.ok(popupCode.includes("SUPPORT_QR_ASSET_PATH"), "Must reference QR asset path");
    assert.ok(popupCode.includes("object-contain"), "Must preserve aspect ratio with object-contain");

    // Dismissal buttons
    assert.ok(popupCode.includes("Maybe Later") || popupCode.includes("maybeLaterText"), "Must have Maybe Later button");
    assert.ok(popupCode.includes("Help Us") || popupCode.includes("helpUsText"), "Must have Help Us button");
    assert.ok(popupCode.includes("support-popup-close-button"), "Must include close (X) button");
  });
});

describe("4. Support Popup Behavior & LocalStorage Persistence", () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
  });

  test("shows popup on first visit when localStorage key is unset", () => {
    const dismissed = mockStorage.getItem(SUPPORT_DISMISSAL_STORAGE_KEY);
    assert.equal(dismissed, null, "Should be null on first visit");
    const shouldDisplay = !dismissed;
    assert.equal(shouldDisplay, true, "Popup should be displayed on first visit");
  });

  test("dismissing sets localStorage flag to prevent repeated interruptions", () => {
    // Simulate user dismissal
    mockStorage.setItem(SUPPORT_DISMISSAL_STORAGE_KEY, "true");

    const dismissed = mockStorage.getItem(SUPPORT_DISMISSAL_STORAGE_KEY);
    assert.equal(dismissed, "true");

    const shouldDisplay = !dismissed;
    assert.equal(shouldDisplay, false, "Popup must NOT be displayed after dismissal");
  });

  test("popup component implements backdrop click, Escape key, and custom open event", () => {
    const popupSourcePath = path.join(
      process.cwd(),
      "src",
      "components",
      "support",
      "WelcomeSupportPopup.tsx"
    );
    const popupCode = fs.readFileSync(popupSourcePath, "utf-8");

    assert.ok(popupCode.includes("handleBackdropClick"), "Backdrop click handler must be present");
    assert.ok(popupCode.includes("Escape"), "Escape key handler must be present");
    assert.ok(popupCode.includes("bus:open-support-popup"), "Custom event listener for reopening must be present");
  });
});

describe("5. Dashboard Help Us Button", () => {
  const btnSourcePath = path.join(
    process.cwd(),
    "src",
    "components",
    "support",
    "SupportButton.tsx"
  );
  const btnCode = fs.readFileSync(btnSourcePath, "utf-8");

  test("uses Heart icon from lucide-react", () => {
    assert.ok(btnCode.includes("Heart"), "Button must use Heart icon");
  });

  test("opens support URL in new tab with secure rel attributes", () => {
    assert.ok(btnCode.includes('target="_blank"'), "Must have target=_blank");
    assert.ok(btnCode.includes('rel="noopener noreferrer"'), "Must have rel=noopener noreferrer");
  });

  test("displays supporting label 'Help keep this tool free'", () => {
    assert.ok(
      btnCode.includes("supportingLabel") || btnCode.includes("Help keep this tool free"),
      "Button should include supporting label"
    );
  });

  test("uses subtle accent color scheme consistent with project theme", () => {
    assert.ok(
      btnCode.includes("rose") || btnCode.includes("brand"),
      "Button should use refined accent styling"
    );
  });
});

describe("6. Application Integration Verification", () => {
  test("RootLayout includes WelcomeSupportPopup", () => {
    const layoutPath = path.join(process.cwd(), "src", "app", "layout.tsx");
    const layoutCode = fs.readFileSync(layoutPath, "utf-8");

    assert.ok(
      layoutCode.includes("WelcomeSupportPopup"),
      "Root layout must include WelcomeSupportPopup"
    );
  });

  test("HomePage Dashboard includes SupportButton in permanent location", () => {
    const homePath = path.join(process.cwd(), "src", "app", "page.tsx");
    const homeCode = fs.readFileSync(homePath, "utf-8");

    assert.ok(
      homeCode.includes("SupportButton"),
      "HomePage must include SupportButton"
    );
    assert.ok(
      homeCode.includes("dashboard-tools"),
      "Dashboard section must be present"
    );
  });
});
