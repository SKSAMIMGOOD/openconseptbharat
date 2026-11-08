"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface PrintContainerProps {
  /**
   * One or more high-resolution page image URLs (data URLs or blob URLs).
   * Each entry represents exactly one physical sheet to be printed.
   */
  pageImages?: string[] | string | null;
  /** Semantic label for accessibility and image alt */
  alt?: string;
}

/**
 * PrintContainer — Unified Portal for High-Accuracy Physical Sheet Printing
 *
 * Architecture Guarantee:
 * 1. Portals the printable DOM directly to document.body.
 * 2. In conjunction with globals.css `@media print`, hides the entire Next.js application tree.
 * 3. Never uses `position: fixed`, preventing Microsoft Print / Chromium page duplication bugs.
 * 4. Renders each physical sheet as an isolated `.print-page` with `break-after: page`
 *    (and `break-after: auto` on `:last-child`), guaranteeing zero accidental blank pages.
 */
export const PrintContainer: React.FC<PrintContainerProps> = ({
  pageImages,
  alt = "Printable Sheet",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined" || !pageImages) {
    return null;
  }

  const images = Array.isArray(pageImages)
    ? pageImages.filter(Boolean)
    : [pageImages].filter(Boolean);

  if (images.length === 0) {
    return null;
  }

  return createPortal(
    <div id="printable-sheet-container" aria-hidden="true">
      {images.map((src, index) => (
        <div
          key={index}
          className="print-page"
          style={{
            pageBreakInside: "avoid",
            breakInside: "avoid",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${alt} — Sheet ${index + 1} of ${images.length}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
              margin: "auto",
            }}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};
