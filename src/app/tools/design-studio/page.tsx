"use client";

import React, { useState, useMemo } from "react";
import type { DesignDocument } from "@/types/design-studio";
import { TemplateGallery } from "@/components/design-studio/TemplateGallery";
import { DesignEditorLayout } from "@/components/design-studio/DesignEditorLayout";
import { InMemoryAssetManager } from "@/lib/design-studio/asset-manager";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";

export default function DesignStudioPage() {
  const [activeDoc, setActiveDoc] = useState<DesignDocument | null>(null);
  const assetManager = useMemo(() => new InMemoryAssetManager(), []);
  const tool = useMemo(() => TOOLS.find((t) => t.id === "design-studio")!, []);

  if (activeDoc) {
    return (
      <div className="w-full h-full min-h-[calc(100vh-64px)] flex flex-col bg-surface-50 dark:bg-surface-950">
        <DesignEditorLayout
          initialDocument={activeDoc}
          assetManager={assetManager}
          onBackToGallery={() => setActiveDoc(null)}
          onDocumentChange={(updated) => setActiveDoc(updated)}
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <ModuleLayout tool={tool}>
      <TemplateGallery onOpenDocument={(doc) => setActiveDoc(doc)} />
    </ModuleLayout>
  );
}
