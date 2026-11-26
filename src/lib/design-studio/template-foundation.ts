/**
 * Design Studio — Template Foundation & Document Factory
 *
 * Implements pure document instantiation, schema validation, element creation,
 * and deep cloning for:
 * 1. Visiting Cards (Front & Back)
 * 2. Wedding Cards (Royal Invitation & Details)
 * 3. School / College Project Covers (Academic A4)
 * 4. ID Cards (CR80 Standard Front & Back)
 */

import type {
  DesignDocument,
  DesignCategory,
  DesignPage,
  DesignElement,
  TextDesignElement,
  ImageDesignElement,
  ShapeDesignElement,
  DesignOrientation,
  PhysicalDimensions,
  ElementTransform,
} from "../../types/design-studio.ts";
import { getDefaultDimensionsForCategory } from "../../constants/design-dimensions.ts";
import { getDesignCategoryConfig } from "../../constants/design-categories.ts";

/**
 * Creates an empty page with standard defaults.
 */
export function createDefaultPage(
  id: string,
  name: string,
  backgroundColor: string = "#ffffff"
): DesignPage {
  return {
    id,
    name,
    background: {
      type: "solid",
      color: backgroundColor,
    },
    elements: [],
  };
}

/**
 * Creates a brand new, empty DesignDocument calibrated for a target category.
 */
export function createEmptyDesignDocument(
  category: DesignCategory,
  customTitle?: string,
  customOrientation?: DesignOrientation,
  customDimensions?: PhysicalDimensions
): DesignDocument {
  const config = getDesignCategoryConfig(category);
  const dimensions = customDimensions || getDefaultDimensionsForCategory(category);
  const orientation = customOrientation || config?.defaultOrientation || "landscape";

  const now = new Date().toISOString();
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const title = customTitle || `${config?.name || "New Design"} ${new Date().toLocaleDateString()}`;

  const pages: DesignPage[] = [];
  const pageNames = config?.defaultPageNames || ["Page 1"];

  for (let i = 0; i < pageNames.length; i++) {
    pages.push(
      createDefaultPage(
        `page-${i + 1}-${Math.random().toString(36).substring(2, 7)}`,
        pageNames[i],
        "#ffffff"
      )
    );
  }

  return {
    schemaVersion: "1.0.0",
    id: docId,
    category,
    metadata: {
      title,
      description: config?.description || "",
      createdAt: now,
      updatedAt: now,
      tags: [category],
    },
    dimensions,
    orientation,
    pages,
    assets: {},
  };
}

/**
 * Creates a default Text element.
 */
export function createTextElement(
  partial: Partial<TextDesignElement> = {}
): TextDesignElement {
  const id = partial.id || `el-text-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id,
    name: partial.name || "Text Box",
    type: "text",
    text: partial.text ?? "Double click to edit",
    fontFamily: partial.fontFamily || "Inter",
    fontSize: partial.fontSize || 16,
    fontWeight: partial.fontWeight || "normal",
    fontStyle: partial.fontStyle || "normal",
    fill: partial.fill || "#111827",
    align: partial.align || "left",
    verticalAlign: partial.verticalAlign || "top",
    lineHeight: partial.lineHeight || 1.3,
    letterSpacing: partial.letterSpacing || 0,
    textDecoration: partial.textDecoration || "none",
    textTransform: partial.textTransform || "none",
    opacity: partial.opacity ?? 1.0,
    locked: Boolean(partial.locked),
    visible: partial.visible ?? true,
    zIndex: partial.zIndex !== undefined ? partial.zIndex : 0,
    transform: {
      x: partial.transform?.x || 20,
      y: partial.transform?.y || 20,
      width: partial.transform?.width || 180,
      height: partial.transform?.height || 40,
      rotation: partial.transform?.rotation || 0,
      scaleX: partial.transform?.scaleX || 1.0,
      scaleY: partial.transform?.scaleY || 1.0,
    },
  };
}

/**
 * Creates a default Shape element.
 */
export function createShapeElement(
  partial: Partial<ShapeDesignElement> = {}
): ShapeDesignElement {
  const id = partial.id || `el-shape-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id,
    name: partial.name || "Shape",
    type: "shape",
    shapeType: partial.shapeType || "rect",
    fill: partial.fill || "#2563eb",
    stroke: partial.stroke || "transparent",
    strokeWidth: partial.strokeWidth || 0,
    strokeDashArray: partial.strokeDashArray,
    cornerRadius: partial.cornerRadius,
    opacity: partial.opacity ?? 1.0,
    locked: Boolean(partial.locked),
    visible: partial.visible ?? true,
    zIndex: partial.zIndex !== undefined ? partial.zIndex : 0,
    transform: {
      x: partial.transform?.x || 20,
      y: partial.transform?.y || 20,
      width: partial.transform?.width || 100,
      height: partial.transform?.height || 60,
      rotation: partial.transform?.rotation || 0,
      scaleX: partial.transform?.scaleX || 1.0,
      scaleY: partial.transform?.scaleY || 1.0,
    },
  };
}

/**
 * Creates a default Image element linked to an asset.
 */
export function createImageElement(
  assetId: string,
  partial: Partial<ImageDesignElement> = {}
): ImageDesignElement {
  const id = partial.id || `el-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id,
    name: partial.name || "Image",
    type: "image",
    assetId,
    fit: partial.fit || "contain",
    borderRadius: partial.borderRadius,
    cropRect: partial.cropRect,
    tintColor: partial.tintColor,
    placeholderRole: partial.placeholderRole,
    opacity: partial.opacity ?? 1.0,
    locked: Boolean(partial.locked),
    visible: partial.visible ?? true,
    zIndex: partial.zIndex !== undefined ? partial.zIndex : 0,
    transform: {
      x: partial.transform?.x || 20,
      y: partial.transform?.y || 20,
      width: partial.transform?.width || 120,
      height: partial.transform?.height || 120,
      rotation: partial.transform?.rotation || 0,
      scaleX: partial.transform?.scaleX || 1.0,
      scaleY: partial.transform?.scaleY || 1.0,
    },
  };
}

/**
 * Validates that an unknown input matches the DesignDocument contract.
 */
export function validateDesignDocument(input: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["Document must be a valid non-null object"] };
  }

  const doc = input as Partial<DesignDocument>;

  if (doc.schemaVersion !== "1.0.0") {
    errors.push("Invalid or missing schemaVersion: expected '1.0.0'");
  }

  if (!doc.id || typeof doc.id !== "string") {
    errors.push("Document requires a valid string id");
  }

  const validCategories: DesignCategory[] = [
    "visiting-card",
    "wedding-card",
    "project-cover",
    "id-card",
  ];
  if (!doc.category || !validCategories.includes(doc.category)) {
    errors.push(`Invalid category: expected one of ${validCategories.join(", ")}`);
  }

  if (!doc.dimensions || typeof doc.dimensions !== "object") {
    errors.push("Missing document dimensions specification");
  } else {
    if (typeof doc.dimensions.widthMm !== "number" || doc.dimensions.widthMm <= 0) {
      errors.push("dimensions.widthMm must be a positive number");
    }
    if (typeof doc.dimensions.heightMm !== "number" || doc.dimensions.heightMm <= 0) {
      errors.push("dimensions.heightMm must be a positive number");
    }
  }

  if (!Array.isArray(doc.pages) || doc.pages.length === 0) {
    errors.push("Document must contain at least one page");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a deep copy of a design document (safe for immutable state updates).
 */
export function cloneDesignDocument(doc: DesignDocument): DesignDocument {
  return JSON.parse(JSON.stringify(doc)) as DesignDocument;
}

/**
 * Immutably updates the spatial transform of an element within a specified page.
 */
export function updateElementTransform(
  doc: DesignDocument,
  pageId: string,
  elementId: string,
  newTransform: Partial<ElementTransform>
): DesignDocument {
  const newPages = doc.pages.map((p) => {
    if (p.id !== pageId) return p;
    return {
      ...p,
      elements: p.elements.map((el) => {
        if (el.id !== elementId) return el;
        return {
          ...el,
          transform: {
            ...el.transform,
            ...newTransform,
          },
        };
      }),
    };
  });

  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
    pages: newPages,
  };
}

/**
 * Inserts a new element onto a specific page in the document.
 * Calculates next zIndex to ensure it appears on top of existing elements.
 */

/**
 * Immutably updates arbitrary properties of an element within a page.
 */
export function updateElementInDocument(
  doc: DesignDocument,
  pageId: string,
  elementId: string,
  updates: Partial<DesignElement>
): DesignDocument {
  const newPages = doc.pages.map((p) => {
    if (p.id !== pageId) return p;
    return {
      ...p,
      elements: p.elements.map((el) => {
        if (el.id !== elementId) return el;
        return {
          ...el,
          ...updates,
          id: el.id, // Preserve immutable ID
          type: el.type, // Preserve immutable element type
        } as DesignElement;
      }),
    };
  });

  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
    pages: newPages,
  };
}


/**
 * Inserts a new element onto a specific page in the document.
 * Calculates next zIndex to ensure it appears on top of existing elements.
 */
export function addElementToPage(
  doc: DesignDocument,
  pageId: string,
  element: DesignElement
): { document: DesignDocument; element: DesignElement } {
  let placedElement = element;
  const newPages = doc.pages.map((p) => {
    if (p.id !== pageId) return p;
    const maxZ = p.elements.reduce((acc, el) => Math.max(acc, el.zIndex || 0), 0);
    placedElement = {
      ...element,
      zIndex: element.zIndex && element.zIndex > 0 ? element.zIndex : maxZ + 1,
    };
    return {
      ...p,
      elements: [...p.elements, placedElement],
    };
  });

  return {
    document: {
      ...doc,
      metadata: {
        ...doc.metadata,
        updatedAt: new Date().toISOString(),
      },
      pages: newPages,
    },
    element: placedElement,
  };
}

/**
 * Creates and inserts a text element into the target page.
 */
export function insertTextElement(
  doc: DesignDocument,
  pageId: string,
  partial: Partial<TextDesignElement> = {}
): { document: DesignDocument; element: TextDesignElement } {
  const element = createTextElement(partial);
  const result = addElementToPage(doc, pageId, element);
  return { document: result.document, element: result.element as TextDesignElement };
}

/**
 * Creates and inserts an image element into the target page, linking it to an asset.
 */
export function insertImageElement(
  doc: DesignDocument,
  pageId: string,
  assetId: string,
  partial: Partial<ImageDesignElement> = {}
): { document: DesignDocument; element: ImageDesignElement } {
  const element = createImageElement(assetId, partial);
  const result = addElementToPage(doc, pageId, element);
  return { document: result.document, element: result.element as ImageDesignElement };
}

/**
 * Creates and inserts a shape element into the target page.
 */
export function insertShapeElement(
  doc: DesignDocument,
  pageId: string,
  partial: Partial<ShapeDesignElement> = {}
): { document: DesignDocument; element: ShapeDesignElement } {
  const element = createShapeElement(partial);
  const result = addElementToPage(doc, pageId, element);
  return { document: result.document, element: result.element as ShapeDesignElement };
}

/**
 * Calculates centered position for inserting a new element onto a page.
 */
export function calculateCenteredPosition(
  pageWidthPt: number,
  pageHeightPt: number,
  elementWidthPt: number,
  elementHeightPt: number
): { x: number; y: number } {
  return {
    x: Math.max(10, Math.round((pageWidthPt - elementWidthPt) / 2)),
    y: Math.max(10, Math.round((pageHeightPt - elementHeightPt) / 2)),
  };
}

/**
 * Deletes an element from a page by ID.
 */
export function deleteElementFromDocument(
  doc: DesignDocument,
  pageId: string,
  elementId: string
): DesignDocument {
  const newPages = doc.pages.map((p) => {
    if (p.id !== pageId) return p;
    return {
      ...p,
      elements: p.elements.filter((el) => el.id !== elementId),
    };
  });

  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
    pages: newPages,
  };
}

/**
 * Duplicates an element with a small offset (+15pt) and returns the updated document and new element.
 */
export function duplicateElementInDocument(
  doc: DesignDocument,
  pageId: string,
  elementId: string
): { document: DesignDocument; element: DesignElement | null } {
  const page = doc.pages.find((p) => p.id === pageId);
  const target = page?.elements.find((el) => el.id === elementId);
  if (!target) return { document: doc, element: null };

  const clone: DesignElement = JSON.parse(JSON.stringify(target));
  const newId = `el-${clone.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  clone.id = newId;
  clone.name = `${clone.name} (Copy)`;
  clone.transform.x = Math.round(clone.transform.x + 15);
  clone.transform.y = Math.round(clone.transform.y + 15);
  clone.zIndex = 0; // Reset to 0 so addElementToPage calculates next highest zIndex

  const result = addElementToPage(doc, pageId, clone);
  return { document: result.document, element: result.element };
}

/**
 * Reorders elements by moving a selected element up, down, to top, or to bottom.
 */
export function reorderElementLayer(
  doc: DesignDocument,
  pageId: string,
  elementId: string,
  direction: "up" | "down" | "top" | "bottom"
): DesignDocument {
  const newPages = doc.pages.map((p) => {
    if (p.id !== pageId) return p;
    // Elements sorted ascending by zIndex (bottom to top)
    const sorted = [...p.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const currentIndex = sorted.findIndex((el) => el.id === elementId);
    if (currentIndex === -1) return p;

    const item = sorted[currentIndex];
    sorted.splice(currentIndex, 1);

    if (direction === "top") {
      sorted.push(item);
    } else if (direction === "bottom") {
      sorted.unshift(item);
    } else if (direction === "up") {
      const newIndex = Math.min(sorted.length, currentIndex + 1);
      sorted.splice(newIndex, 0, item);
    } else if (direction === "down") {
      const newIndex = Math.max(0, currentIndex - 1);
      sorted.splice(newIndex, 0, item);
    }

    // Re-index zIndices deterministically 1, 2, 3...
    const reindexed = sorted.map((el, idx) => ({
      ...el,
      zIndex: idx + 1,
    }));

    return {
      ...p,
      elements: reindexed,
    };
  });

  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
    pages: newPages,
  };
}

/**
 * Reorders entire elements array directly (e.g. from Drag and Drop).
 */
export function reorderElementsList(
  doc: DesignDocument,
  pageId: string,
  orderedElementIds: string[]
): DesignDocument {
  const newPages = doc.pages.map((p) => {
    if (p.id !== pageId) return p;
    const elementMap = new Map(p.elements.map((el) => [el.id, el]));
    const reordered: DesignElement[] = [];

    // Top of visual list in UI usually represents highest zIndex
    // But internally, orderedElementIds is passed from bottom-to-top or top-to-bottom
    orderedElementIds.forEach((id, idx) => {
      const el = elementMap.get(id);
      if (el) {
        reordered.push({
          ...el,
          zIndex: idx + 1,
        });
        elementMap.delete(id);
      }
    });

    // Add any remaining unmentioned elements
    elementMap.forEach((el) => {
      reordered.push({
        ...el,
        zIndex: reordered.length + 1,
      });
    });

    return {
      ...p,
      elements: reordered,
    };
  });

  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      updatedAt: new Date().toISOString(),
    },
    pages: newPages,
  };
}
