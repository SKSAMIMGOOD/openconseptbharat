"use client";

import React from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { DocumentStudioWorkspace } from "@/components/document-studio/DocumentStudioWorkspace";

/**
 * Document Studio — Phase 08B
 * Supports single-upload document detection, separation of both Front and Back sides,
 * Re-detect / Re-run Auto Detection, Split Horizontally (Left + Right),
 * Split Vertically (Top + Bottom), and manual CR80 crop.
 */
export default function DocumentStudioPage() {
  const tool = TOOLS.find((t) => t.id === "document-studio")!;

  return (
    <ModuleLayout tool={tool}>
      <DocumentStudioWorkspace />
    </ModuleLayout>
  );
}
