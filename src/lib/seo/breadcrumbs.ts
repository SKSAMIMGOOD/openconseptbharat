import type { ToolMetadata } from "@/types/tools";
import { getCategoryMetadata } from "../../constants/tools.ts";
import { SITE_URL } from "./structured-data.ts";
export { SITE_URL };

/**
 * Breadcrumb label overrides when a tool requires a specific breadcrumb title
 * different from its registry marketing name (e.g., preserving test invariants).
 */
export const TOOL_BREADCRUMB_NAME_OVERRIDES: Record<string, string> = {
  "document-straightener": "Document Straightener",
};

export interface ToolCategoryBreadcrumbInfo {
  id: string;
  name: string;
  href: string;
}

export interface BreadcrumbVisualItem {
  label: string;
  href?: string;
}

export interface BreadcrumbListItemSchema {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbListItemSchema[];
}

/**
 * Resolves the display name for a tool within breadcrumb trails.
 */
export function getToolBreadcrumbName(tool: ToolMetadata): string {
  if (!tool) return "";
  return TOOL_BREADCRUMB_NAME_OVERRIDES[tool.id] || tool.name;
}

/**
 * Resolves the parent category breadcrumb details for a given tool.
 * Falls back to "All Tools" (/tools) if no specific category is assigned.
 */
export function getToolCategoryBreadcrumb(tool: ToolMetadata): ToolCategoryBreadcrumbInfo {
  if (!tool) {
    return {
      id: "all",
      name: "All Tools",
      href: "/tools",
    };
  }

  const meta = getCategoryMetadata(tool.category);
  if (meta && meta.title) {
    return {
      id: meta.id,
      name: meta.title,
      href: `/tools?category=${meta.id}`,
    };
  }

  return {
    id: "all",
    name: "All Tools",
    href: "/tools",
  };
}

/**
 * Generates the 2-level relative items array passed to the visual Breadcrumb UI
 * (which automatically renders Home as the root level, producing a 3-level trail:
 * Home → Category → Tool).
 */
export function getToolVisualBreadcrumbs(tool: ToolMetadata): BreadcrumbVisualItem[] {
  const category = getToolCategoryBreadcrumb(tool);
  const toolName = getToolBreadcrumbName(tool);

  return [
    {
      label: category.name,
      href: category.href,
    },
    {
      label: toolName,
    },
  ];
}

/**
 * Generates Google-compliant BreadcrumbList Schema.org structured data for a tool page.
 * Follows Google specification:
 * - Position 1: Home (https://www.printreadydesigns.in)
 * - Position 2: Category (https://www.printreadydesigns.in/tools?category=<category>)
 * - Position 3: Tool (https://www.printreadydesigns.in/tools/<slug>)
 */
export function getToolBreadcrumbListSchema(
  tool: ToolMetadata,
  baseUrl: string = SITE_URL
): BreadcrumbListSchema {
  const cleanBase = (baseUrl || SITE_URL).replace(/\/+$/, "");
  const category = getToolCategoryBreadcrumb(tool);
  const toolName = getToolBreadcrumbName(tool);
  const toolRoute = tool.route.startsWith("/") ? tool.route : `/${tool.route}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: cleanBase,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${cleanBase}${category.href}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: toolName,
        item: `${cleanBase}${toolRoute}`,
      },
    ],
  };
}

export interface GenericBreadcrumbInput {
  name: string;
  path?: string;
}

/**
 * Generic Schema.org BreadcrumbList generator for any multi-tier navigation path.
 */
export function getBreadcrumbListSchema(
  items: GenericBreadcrumbInput[],
  baseUrl: string = SITE_URL
): BreadcrumbListSchema {
  const cleanBase = (baseUrl || SITE_URL).replace(/\/+$/, "");
  const list: BreadcrumbListItemSchema[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: cleanBase,
    },
  ];

  items.forEach((item, index) => {
    const position = index + 2;
    let absoluteUrl: string;
    if (item.path) {
      absoluteUrl = item.path.startsWith("http")
        ? item.path
        : `${cleanBase}${item.path.startsWith("/") ? "" : "/"}${item.path}`;
    } else {
      absoluteUrl = cleanBase;
    }

    list.push({
      "@type": "ListItem",
      position,
      name: item.name,
      item: absoluteUrl,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list,
  };
}

/**
 * BreadcrumbList schema for /tools (All Tools directory).
 */
export function getToolsIndexBreadcrumbSchema(baseUrl: string = SITE_URL): BreadcrumbListSchema {
  return getBreadcrumbListSchema(
    [
      {
        name: "All Tools",
        path: "/tools",
      },
    ],
    baseUrl
  );
}

/**
 * BreadcrumbList schema for /about page.
 */
export function getAboutBreadcrumbSchema(baseUrl: string = SITE_URL): BreadcrumbListSchema {
  return getBreadcrumbListSchema(
    [
      {
        name: "About",
        path: "/about",
      },
    ],
    baseUrl
  );
}

/**
 * BreadcrumbList schema for /contact page.
 */
export function getContactBreadcrumbSchema(baseUrl: string = SITE_URL): BreadcrumbListSchema {
  return getBreadcrumbListSchema(
    [
      {
        name: "Contact",
        path: "/contact",
      },
    ],
    baseUrl
  );
}

/**
 * BreadcrumbList schema for /privacy page.
 */
export function getPrivacyBreadcrumbSchema(baseUrl: string = SITE_URL): BreadcrumbListSchema {
  return getBreadcrumbListSchema(
    [
      {
        name: "Privacy Policy",
        path: "/privacy",
      },
    ],
    baseUrl
  );
}

/**
 * BreadcrumbList schema for /terms page.
 */
export function getTermsBreadcrumbSchema(baseUrl: string = SITE_URL): BreadcrumbListSchema {
  return getBreadcrumbListSchema(
    [
      {
        name: "Terms of Use",
        path: "/terms",
      },
    ],
    baseUrl
  );
}

/**
 * BreadcrumbList schema for /settings page.
 */
export function getSettingsBreadcrumbSchema(baseUrl: string = SITE_URL): BreadcrumbListSchema {
  return getBreadcrumbListSchema(
    [
      {
        name: "Settings",
        path: "/settings",
      },
    ],
    baseUrl
  );
}

/**
 * Safely serializes structured JSON-LD into a script string, escaping HTML control characters
 * to eliminate XSS risks inside JSON-LD script tags.
 */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
