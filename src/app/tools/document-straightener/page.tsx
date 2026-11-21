"use client";

import React from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { DocumentStraightenerWorkspace } from "@/components/document-straightener/DocumentStraightenerWorkspace";

/**
 * Document Straightener — Perspective Correction Tool
 * Allows uploading tilted, rotated, and perspective-distorted document photographs,
 * adjusting 4 corners with a precision magnification loupe, and straightening
 * them into rectangular document outputs with dual-side support.
 */
export default function DocumentStraightenerPage() {
  const tool = TOOLS.find((t) => t.id === "document-straightener")!;

  return (
    <ModuleLayout tool={tool}>
      <DocumentStraightenerWorkspace />
    </ModuleLayout>
  );
}
