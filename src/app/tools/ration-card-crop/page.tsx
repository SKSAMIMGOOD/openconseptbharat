"use client";

import React from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { DocumentStudioWorkspace } from "@/components/document-studio/DocumentStudioWorkspace";

export default function RationCardCropPage() {
  const tool = TOOLS.find((t) => t.id === "ration-card-crop")!;

  return (
    <ModuleLayout tool={tool}>
      <DocumentStudioWorkspace initialDocType="ration-card" lockDocType={true} />
    </ModuleLayout>
  );
}
