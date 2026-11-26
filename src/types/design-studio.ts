/**
 * Design Studio — Engine-Independent Core Schema & Types
 *
 * Implements the pure, renderer-agnostic data contracts for template documents,
 * pages, layers, and editable canvas objects across:
 * - Visiting Cards
 * - Wedding Cards
 * - School / College Project Covers
 * - ID Cards
 *
 * INVARIANT:
 * This schema is 100% independent of Konva, HTML Canvas, or DOM references.
 * It is fully serializable as JSON, deterministic, and immutable-friendly.
 */

/** Supported Design Studio product categories */
export type DesignCategory =
  | "visiting-card"
  | "wedding-card"
  | "project-cover"
  | "id-card";

/** Supported element types on the design canvas */
export type DesignElementType = "text" | "image" | "shape";

/** Page orientation */
export type DesignOrientation = "portrait" | "landscape";

/** Supported shape geometries */
export type ShapeGeometry =
  | "rect"
  | "circle"
  | "ellipse"
  | "line"
  | "divider"
  | "star"
  | "triangle";

/** Supported text alignments */
export type TextHorizontalAlign = "left" | "center" | "right" | "justify";
export type TextVerticalAlign = "top" | "middle" | "bottom";
export type TextDecoration = "none" | "underline" | "line-through";
export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";

/**
 * 2D Affine Transform in logical points (1 pt = 1/72 inch).
 * Keeps spatial geometry independent of screen pixel ratios or target print DPI.
 */
export interface ElementTransform {
  /** Horizontal position in logical canvas points from page origin (top-left) */
  x: number;
  /** Vertical position in logical canvas points from page origin (top-left) */
  y: number;
  /** Bounding box width in logical canvas points */
  width: number;
  /** Bounding box height in logical canvas points */
  height: number;
  /** Rotation angle in clockwise degrees (0 - 360) */
  rotation: number;
  /** Horizontal scale multiplier (default 1.0) */
  scaleX: number;
  /** Vertical scale multiplier (default 1.0) */
  scaleY: number;
}

/** Common properties shared by every canvas element */
export interface BaseDesignElement {
  /** Unique element identifier (UUID or timestamp-hash) */
  id: string;
  /** Human-readable layer name (e.g. "Company Name", "Profile Photo", "Accent Stripe") */
  name: string;
  /** Type discriminator */
  type: DesignElementType;
  /** Spatial positioning and bounding box */
  transform: ElementTransform;
  /** Element opacity (0.0 to 1.0) */
  opacity: number;
  /** User interaction lock (prevents accidental movement/deletion) */
  locked: boolean;
  /** Layer visibility toggle */
  visible: boolean;
  /** Layer stacking index (higher zIndex renders on top) */
  zIndex: number;
}

/** Rich typography element */
export interface TextDesignElement extends BaseDesignElement {
  type: "text";
  /** Text content (may include line breaks) */
  text: string;
  /** Font family name (e.g. "Inter", "Poppins", "Playfair Display", "Merriweather") */
  fontFamily: string;
  /** Font size in logical points */
  fontSize: number;
  /** CSS-compatible font weight */
  fontWeight: "normal" | "bold" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  /** Font style */
  fontStyle: "normal" | "italic";
  /** Primary text color in Hex (#RRGGBB) or RGBA string */
  fill: string;
  /** Horizontal alignment */
  align: TextHorizontalAlign;
  /** Vertical alignment */
  verticalAlign: TextVerticalAlign;
  /** Line height multiplier (e.g. 1.2, 1.4) */
  lineHeight: number;
  /** Letter spacing tracking in points */
  letterSpacing: number;
  /** Text decoration */
  textDecoration: TextDecoration;
  /** Case transformation */
  textTransform: TextTransform;
}

/** Crop rectangle within an image source */
export interface ImageCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bitmap or vector image element referencing an asset */
export interface ImageDesignElement extends BaseDesignElement {
  type: "image";
  /** ID of the asset stored in the document asset registry */
  assetId: string;
  /** Image fitting strategy inside the element bounding box */
  fit: "contain" | "cover" | "fill";
  /** Optional corner rounding radius in points */
  borderRadius?: number;
  /** Optional non-destructive sub-rectangle cropping */
  cropRect?: ImageCropRect;
  /** Optional tint color overlay */
  tintColor?: string;
  /** Semantic role hint for templates */
  placeholderRole?: "avatar" | "logo" | "cover-art" | "qr-code" | "watermark";
}

/** Vector geometric shape element */
export interface ShapeDesignElement extends BaseDesignElement {
  type: "shape";
  /** Geometric primitive */
  shapeType: ShapeGeometry;
  /** Fill color in Hex (#RRGGBB, "transparent") or RGBA */
  fill: string;
  /** Outline stroke color in Hex or RGBA */
  stroke: string;
  /** Stroke thickness in points (0 for no stroke) */
  strokeWidth: number;
  /** Optional dashed stroke pattern [dashLength, spaceLength] */
  strokeDashArray?: number[];
  /** Corner radius for rectangles */
  cornerRadius?: number;
}

/** Discriminated union of all design elements */
export type DesignElement =
  | TextDesignElement
  | ImageDesignElement
  | ShapeDesignElement;

/** Linear gradient definition for page backdrops or shapes */
export interface LinearGradientConfig {
  angleDegrees: number; // 0 to 360
  colorStops: Array<{ offset: number; color: string }>; // offset: 0 to 1
}

/** Page background specification */
export interface PageBackgroundConfig {
  /** Background type */
  type: "solid" | "gradient" | "image" | "transparent";
  /** Solid background color (Hex or RGBA) */
  color: string;
  /** Gradient settings (when type is "gradient") */
  gradient?: LinearGradientConfig;
  /** Asset ID of background picture (when type is "image") */
  assetId?: string;
  /** Background image opacity (0.0 to 1.0) */
  opacity?: number;
}

/** An individual page / side in a multi-page document */
export interface DesignPage {
  /** Unique page identifier */
  id: string;
  /** Human-readable page title (e.g. "Front Side", "Back Side", "Cover Page") */
  name: string;
  /** Page background styling */
  background: PageBackgroundConfig;
  /** Canvas elements contained on this page */
  elements: DesignElement[];
}

/** Physical print and paper dimensions */
export interface PhysicalDimensions {
  /** Real-world width in millimeters */
  widthMm: number;
  /** Real-world height in millimeters */
  heightMm: number;
  /** Printing cutting bleed margin in millimeters (typically 2-3 mm) */
  bleedMm: number;
  /** Interior safe zone margin for non-bleeding text/content in millimeters */
  safeMarginMm: number;
  /** Target resolution for raster master exports (typically 300 or 600 DPI) */
  targetDpi: number;
}

/** In-memory asset entry stored in the document */
export interface DesignAsset {
  /** Unique asset identifier */
  id: string;
  /** Original file name or descriptive label */
  name: string;
  /** Asset kind */
  type: "image" | "svg";
  /** Standard MIME type (e.g. "image/png", "image/jpeg", "image/svg+xml") */
  mimeType: string;
  /** Ephemeral Object URL (in client memory) or base64 data URL */
  url: string;
  /** Intrinsic pixel width */
  width: number;
  /** Intrinsic pixel height */
  height: number;
  /** File size in bytes */
  sizeBytes?: number;
}

/** Document metadata */
export interface DesignMetadata {
  /** Human-readable template or project title */
  title: string;
  /** Optional author / creator credit */
  author?: string;
  /** Description or design notes */
  description?: string;
  /** Optional tags for filtering */
  tags?: string[];
  /** Identifier of the template from which this document was instantiated */
  templateId?: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  updatedAt: string;
}

/**
 * Root Design Document Specification.
 * Represents an entire self-contained, serializable design project.
 */
export interface DesignDocument {
  /** Semantic schema version */
  schemaVersion: "1.0.0";
  /** Unique project identifier */
  id: string;
  /** Design category classification */
  category: DesignCategory;
  /** Descriptive metadata */
  metadata: DesignMetadata;
  /** Physical real-world dimensions and print specifications */
  dimensions: PhysicalDimensions;
  /** Page orientation */
  orientation: DesignOrientation;
  /** Sequence of pages (e.g. Front & Back for cards; single cover page for projects) */
  pages: DesignPage[];
  /** Document asset dictionary indexed by asset ID */
  assets: Record<string, DesignAsset>;
}

/** Template definition structure used by template galleries */
export interface DesignTemplateDefinition {
  /** Unique template identifier */
  id: string;
  /** Category */
  category: DesignCategory;
  /** Display title */
  title: string;
  /** Short summary */
  description: string;
  /** Thumbnail preview path or URL */
  thumbnailUrl: string;
  /** Tags for discovery */
  tags: string[];
  /** Factory function or static document model for instantiation */
  createDocument: () => DesignDocument;
}
