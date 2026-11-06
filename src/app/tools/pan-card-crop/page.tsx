"use client";

import React from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { DocumentStudioWorkspace } from "@/components/document-studio/DocumentStudioWorkspace";

export default function PanCardCropPage() {
  const tool = TOOLS.find((t) => t.id === "pan-card-crop")!;

  return (
    <ModuleLayout tool={tool}>
      <DocumentStudioWorkspace initialDocType="pan" lockDocType={true} />
    </ModuleLayout>
  );
}
