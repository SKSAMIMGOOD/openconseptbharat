"use client";

import React from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { DocumentStudioWorkspace } from "@/components/document-studio/DocumentStudioWorkspace";

export default function AadhaarCardCropPage() {
  const tool = TOOLS.find((t) => t.id === "aadhaar-card-crop")!;

  return (
    <ModuleLayout tool={tool}>
      <DocumentStudioWorkspace initialDocType="aadhaar" lockDocType={true} />
    </ModuleLayout>
  );
}
