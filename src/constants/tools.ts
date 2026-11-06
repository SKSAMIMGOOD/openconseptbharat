import type { CategoryMetadata, ToolCategory, ToolMetadata } from "@/types/tools";

export const TOOL_CATEGORIES: CategoryMetadata[] = [
  {
    id: "photo-studio",
    title: "Photo Studio",
    subtitle: "Passport, visa & biometric photo studio",
    description:
      "Generate compliant passport photos, visa portraits, and stamp-size prints with standard biometric dimensions and customizable backdrops.",
    iconName: "Camera",
    toolCount: 1,
  },
  {
    id: "image-tools",
    title: "Image Tools",
    subtitle: "AI background removal & photo enhancement",
    description:
      "Remove image backgrounds with local neural networks, crop, rotate, adjust tone, and compress pictures in browser memory.",
    iconName: "Scissors",
    toolCount: 2,
  },
  {
    id: "photo-printing",
    title: "Photo Printing",
    subtitle: "Passport sheets & print layouts",
    description:
      "Tile identical or mixed passport photos on standard print paper sizes (A4, 4×6, 5×7) with customizable spacing and cutting guide marks.",
    iconName: "Printer",
    toolCount: 1,
  },
  {
    id: "utilities",
    title: "Utilities",
    subtitle: "Government ID card crops & ATS resume builder",
    description:
      "Crop PAN, Aadhaar, and Ration cards to strict ISO ID-1 physical card proportions for laminated printing, and craft ATS-ready resumes.",
    iconName: "SlidersHorizontal",
    toolCount: 5,
  },
];

export const TOOLS: ToolMetadata[] = [
  {
    id: "photo-studio",
    name: "Professional Photo Studio",
    category: "photo-studio",
    categories: ["photo-studio", "photo-printing", "photo"],
    shortDescription:
      "Generate standard Indian passport, visa, and stamp-size photos with customizable backdrops.",
    description:
      "Configure passport and visa photos matching official Indian and international standard dimensions with instant crop presets, uniform background colors, and fine print calibration.",
    route: "/tools/photo-studio",
    status: "ready",
    badge: "Passport & Visa",
    iconName: "Camera",
    features: [
      "Indian Passport (35×45 mm)",
      "US & Schengen Visa presets",
      "300 DPI resolution rendering",
      "Name & Date imprint footer",
    ],
    fileAccept: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 20,
  },
  {
    id: "background-remover",
    name: "Background Remover",
    category: "image-tools",
    categories: ["image-tools", "photo-studio", "photo"],
    shortDescription:
      "Remove image backgrounds automatically using local in-browser AI processing.",
    description:
      "Isolate subjects and eliminate backgrounds with high precision using browser-compiled AI neural networks without sending any image bytes across the web.",
    route: "/tools/background-remover",
    status: "ready",
    badge: "Local AI",
    iconName: "Scissors",
    features: [
      "100% on-device AI model execution",
      "Clean edge detection around hair & clothing",
      "Replace with transparent, solid, or custom backdrop",
      "Zero API fees, zero upload latency",
    ],
    fileAccept: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 25,
  },
  {
    id: "photo-editor",
    name: "Advanced Photo Editor",
    category: "image-tools",
    categories: ["image-tools", "photo"],
    shortDescription:
      "Crop, rotate, adjust tone, and compress photos to exact target file sizes in browser memory.",
    description:
      "A fast, privacy-focused image editor offering essential enhancements, curve corrections, aspect ratio cropping, and compression control.",
    route: "/tools/photo-editor",
    status: "ready",
    badge: "Canvas Editor",
    iconName: "SlidersHorizontal",
    features: [
      "Non-destructive client-side adjustments",
      "Brightness, contrast, saturation & sharpness",
      "Aspect ratio cropping presets",
      "Target file-size compressor (e.g. <50KB for govt forms)",
    ],
    fileAccept: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 25,
  },
  {
    id: "multiple-photo-maker",
    name: "Multiple Photo Maker",
    category: "photo-printing",
    categories: ["photo-printing", "photo-studio", "photo", "pdf"],
    shortDescription:
      "Arrange multiple passport copies on A4, 4×6, or 5×7 photo sheets ready for printing.",
    description:
      "Tile identical or mixed passport photos on standard print paper sizes with automatic spacing, cutting guide marks, and print margin configuration.",
    route: "/tools/multiple-photo-maker",
    status: "ready",
    badge: "Print Sheets",
    iconName: "Printer",
    features: [
      "Auto-fill A4, 4×6 inch, 5×7 inch sheets",
      "Adjustable horizontal & vertical gaps",
      "Cutting line markers for shears/cutters",
      "Direct 1:1 scale high-res print export",
    ],
    fileAccept: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 20,
  },
  {
    id: "pan-card-crop",
    name: "PAN Card Crop",
    category: "utilities",
    categories: ["utilities", "document", "pdf"],
    shortDescription:
      "Extract front and back PAN card sections from scanned PDFs or images into standard size.",
    description:
      "Quickly crop front and back sides of scanned e-PAN or physical PAN documents to exact standard card dimensions (85.6 × 53.98 mm) formatted for direct print or PVC card making.",
    route: "/tools/pan-card-crop",
    status: "ready",
    badge: "ISO ID-1",
    iconName: "CreditCard",
    features: [
      "Fixed ISO/IEC 7810 ID-1 card proportions",
      "Auto dual-side front & back crop workflow",
      "PDF & high-res image input support",
      "One-click printable A4 layout generation",
    ],
    fileAccept: ["application/pdf", "image/jpeg", "image/png"],
    maxFileSizeMB: 30,
  },
  {
    id: "aadhaar-card-crop",
    name: "Aadhaar Card Crop",
    category: "utilities",
    categories: ["utilities", "document", "pdf"],
    shortDescription:
      "Crop e-Aadhaar letters or scans into standardized front/back printable wallet card format.",
    description:
      "Process password-protected or unprotected e-Aadhaar PDF documents locally to isolate front and back card segments with calibrated 300 DPI print output.",
    route: "/tools/aadhaar-card-crop",
    status: "ready",
    badge: "Encrypted PDF",
    iconName: "Fingerprint",
    features: [
      "Standard Aadhaar card aspect ratio locking",
      "Local browser PDF rendering with password unlock",
      "Sharpening filter for text & QR code clarity",
      "Single-page front & back combined layout",
    ],
    fileAccept: ["application/pdf", "image/jpeg", "image/png"],
    maxFileSizeMB: 30,
  },
  {
    id: "ration-card-crop",
    name: "Ration Card Crop",
    category: "utilities",
    categories: ["utilities", "document", "pdf"],
    shortDescription:
      "Crop and reformat digitized Ration Card documents for clean laminated printouts.",
    description:
      "Crop and standardize digital Ration Card printouts, booklet pages, or e-Ration slips with high contrast enhancement for legible text and barcode retention.",
    route: "/tools/ration-card-crop",
    status: "ready",
    badge: "Card Tool",
    iconName: "FileCheck",
    features: [
      "Preset crop boundaries for state e-Ration formats",
      "Greyscale & contrast boost for thermal text",
      "Side-by-side folding card layout",
      "Direct client-side PDF generation",
    ],
    fileAccept: ["application/pdf", "image/jpeg", "image/png"],
    maxFileSizeMB: 30,
  },
  {
    id: "resume-maker",
    name: "Resume / CV Maker",
    category: "utilities",
    categories: ["utilities", "resume", "pdf"],
    shortDescription:
      "Create clean, modern ATS-friendly resumes with instant browser vector PDF rendering.",
    description:
      "Craft professional, job-ready resumes with structured templates, real-time preview, and instant client-side vector PDF generation that never stores your personal details.",
    route: "/tools/resume-maker",
    status: "ready",
    badge: "ATS Ready",
    iconName: "FileText",
    features: [
      "Modern ATS-optimized resume templates",
      "Live interactive side-by-side preview",
      "Structured sections: Experience, Education, Skills",
      "Direct vector PDF export via pdf-lib",
    ],
    fileAccept: [],
    maxFileSizeMB: 5,
  },
  {
    id: "document-studio",
    name: "Document Studio",
    category: "utilities",
    categories: ["utilities", "document", "pdf"],
    shortDescription:
      "Upload, manage, and process standard identity documents and card sides in browser memory.",
    description:
      "Privacy-first document processing workspace for Aadhaar, PAN, Voter ID, Ration cards, and custom IDs with dual-side support.",
    route: "/tools/document-studio",
    status: "ready",
    badge: "Card & Doc Studio",
    iconName: "FileCheck",
    features: [
      "Aadhaar, PAN, Voter ID & Ration Card presets",
      "Independent Front & Back side upload workspace",
      "Zero-upload client-side memory processing",
      "JPG, PNG & multi-page PDF rendering",
    ],
    fileAccept: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 30,
  },
];

/**
 * Look up a tool by its unique identifier.
 */
export function getToolById(id: string): ToolMetadata | undefined {
  return TOOLS.find((t) => t.id === id);
}

/**
 * Filter tools by category. Pass "all" to retrieve all available tools.
 */
export function getToolsByCategory(category: ToolCategory | "all"): ToolMetadata[] {
  if (category === "all") return [...TOOLS];
  return TOOLS.filter(
    (t) => t.category === category || (t.categories && t.categories.includes(category))
  );
}

/**
 * Search tools across name, description, features, badge, and categories.
 */
export function searchTools(query: string, category: ToolCategory | "all" = "all"): ToolMetadata[] {
  const normalizedQuery = query.trim().toLowerCase();
  const categoryFiltered = getToolsByCategory(category);

  if (!normalizedQuery) {
    return categoryFiltered;
  }

  return categoryFiltered.filter((tool) => {
    const inName = tool.name.toLowerCase().includes(normalizedQuery);
    const inShortDesc = tool.shortDescription.toLowerCase().includes(normalizedQuery);
    const inDesc = tool.description.toLowerCase().includes(normalizedQuery);
    const inFeatures = tool.features.some((f) => f.toLowerCase().includes(normalizedQuery));
    const inBadge = tool.badge?.toLowerCase().includes(normalizedQuery) || false;
    const inId = tool.id.toLowerCase().includes(normalizedQuery);
    return inName || inShortDesc || inDesc || inFeatures || inBadge || inId;
  });
}

/**
 * Retrieve curated featured tools for spotlight and hero navigation.
 */
export function getFeaturedTools(): ToolMetadata[] {
  const featuredIds = [
    "photo-studio",
    "background-remover",
    "multiple-photo-maker",
    "photo-editor",
    "pan-card-crop",
  ];
  return featuredIds
    .map((id) => getToolById(id))
    .filter((t): t is ToolMetadata => Boolean(t));
}

/**
 * Get category metadata by category identifier.
 */
export function getCategoryMetadata(categoryId: ToolCategory): CategoryMetadata | undefined {
  return TOOL_CATEGORIES.find((c) => c.id === categoryId);
}
