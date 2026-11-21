import React from "react";
import { ToolMetadata } from "@/types/tools";
import {
  BreadcrumbListSchema,
  getToolBreadcrumbListSchema,
  safeJsonLdStringify,
} from "@/lib/seo/breadcrumbs";

export interface BreadcrumbJsonLdProps {
  tool?: ToolMetadata;
  schema?: BreadcrumbListSchema;
}

/**
 * Reusable JSON-LD Breadcrumb component for emitting Google-compliant
 * Schema.org BreadcrumbList structured data.
 */
export const BreadcrumbJsonLd: React.FC<BreadcrumbJsonLdProps> = ({ tool, schema }) => {
  const jsonLdData = schema || (tool ? getToolBreadcrumbListSchema(tool) : null);

  if (!jsonLdData) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLdStringify(jsonLdData),
      }}
    />
  );
};
