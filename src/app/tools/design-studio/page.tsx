"use client";

import React, { useState, useMemo } from "react";
import type { DesignDocument } from "@/types/design-studio";
import { TemplateGallery } from "@/components/design-studio/TemplateGallery";
import { DesignEditorLayout } from "@/components/design-studio/DesignEditorLayout";
import { InMemoryAssetManager } from "@/lib/design-studio/asset-manager";

export default function DesignStudioPage() {
  const [activeDoc, setActiveDoc] = useState<DesignDocument | null>(null);
  const assetManager = useMemo(() => new InMemoryAssetManager(), []);

  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)] flex flex-col bg-surface-50 dark:bg-surface-950">
      {activeDoc ? (
        <DesignEditorLayout
          initialDocument={activeDoc}
          assetManager={assetManager}
          onBackToGallery={() => setActiveDoc(null)}
          onDocumentChange={(updated) => setActiveDoc(updated)}
          className="flex-1"
        />
      ) : (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <TemplateGallery
            onOpenDocument={(doc) => setActiveDoc(doc)}
          />
        </main>
      )}
    </div>
  );
}
