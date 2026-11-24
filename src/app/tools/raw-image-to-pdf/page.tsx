"use client";

import React from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { RawImageToPdfWorkspace } from "@/components/raw-image-to-pdf/RawImageToPdfWorkspace";

export default function RawImageToPdfPage() {
  const tool = TOOLS.find((t) => t.id === "raw-image-to-pdf")!;

  return (
    <ModuleLayout tool={tool}>
      <RawImageToPdfWorkspace />
    </ModuleLayout>
  );
}
