"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { DocumentStudioWorkspace } from "@/components/document-studio/DocumentStudioWorkspace";
import type { DocumentTypeId } from "@/types/document-studio";

function DocumentStudioContent() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type") || searchParams.get("docType") || searchParams.get("preset");

  let initialDocType: DocumentTypeId | undefined = undefined;
  if (rawType === "voter-id" || rawType === "voter" || rawType === "epic") {
    initialDocType = "voter-id";
  } else if (rawType === "custom" || rawType === "custom-document") {
    initialDocType = "custom";
  } else if (rawType === "pan") {
    initialDocType = "pan";
  } else if (rawType === "aadhaar") {
    initialDocType = "aadhaar";
  } else if (rawType === "ration-card" || rawType === "ration") {
    initialDocType = "ration-card";
  }

  return (
    <DocumentStudioWorkspace
      key={initialDocType || "default"}
      initialDocType={initialDocType}
    />
  );
}

/**
 * Document Studio — Phase 08B
 * Supports single-upload document detection, separation of both Front and Back sides,
 * Re-detect / Re-run Auto Detection, Split Horizontally (Left + Right),
 * Split Vertically (Top + Bottom), manual CR80 crop, and direct preset deep-linking.
 */
export default function DocumentStudioPage() {
  const tool = TOOLS.find((t) => t.id === "document-studio")!;

  return (
    <ModuleLayout tool={tool}>
      <Suspense fallback={null}>
        <DocumentStudioContent />
      </Suspense>
    </ModuleLayout>
  );
}
