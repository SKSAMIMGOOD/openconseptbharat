import type { Metadata } from "next";

/**
 * Tool SEO Configuration & Educational Content for Print Ready Designs.
 * 
 * Defines target H1 headings, SEO titles, meta descriptions, search keywords,
 * contextual introductions, "How to Use" guides, visible FAQs, and internal
 * cross-links for every public tool page.
 */

export interface HowToUseStep {
  step: number;
  title: string;
  description: string;
}

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface RelatedToolLink {
  toolId: string;
  title: string;
  href: string;
  description: string;
}

export interface ToolCategoryHighlight {
  title: string;
  subtitle: string;
  dimensions: string;
  description: string;
}

export interface ToolSeoData {
  toolId: string;
  h1: string;
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  keywords: string[];
  intro: string;
  howToUse: HowToUseStep[];
  faqs: ToolFaq[];
  relatedTools: RelatedToolLink[];
  categoryHighlights?: ToolCategoryHighlight[];
}

export const TOOL_SEO_MAP: Record<string, ToolSeoData> = {
  "aadhaar-card-crop": {
    toolId: "aadhaar-card-crop",
    h1: "Free Online e-Aadhaar Card Cropper – PVC Card Print Size",
    seoTitle: "Free e-Aadhaar Card Cropper Online – PVC Print Size PDF Tool | Print Ready Designs",
    metaDescription:
      "Crop e-Aadhaar PDF letters into standard PVC wallet card size (85.6 × 53.98 mm). Local password unlock, front & back separation, 300 DPI A4 print PDF export with zero server uploads.",
    primaryKeyword: "e-Aadhaar card cropper online",
    keywords: [
      "e-Aadhaar card cropper online",
      "free eaadhaar crop online",
      "aadhaar card pvc print size",
      "aadhaar card crop to wallet size",
      "eaadhaar password unlock online",
      "crop front and back aadhaar card",
      "aadhaar pdf print ready a4",
    ],
    intro:
      "Crop official UIDAI e-Aadhaar letters or scanned documents into standard physical wallet card dimensions (ISO/IEC 7810 ID-1: 85.6 × 53.98 mm). Unlock password-protected PDFs locally in your browser memory and generate sharp 300 DPI A4 print layouts for instant PVC card making or lamination.",
    howToUse: [
      {
        step: 1,
        title: "Upload Your e-Aadhaar Document",
        description:
          "Select your official UIDAI e-Aadhaar PDF or scanned image. If your PDF is password-protected, enter your 8-character password (the first 4 letters of your name in CAPITALS followed by your 4-digit birth year).",
      },
      {
        step: 2,
        title: "Verify Auto-Crop Boundaries",
        description:
          "Our smart boundary detector frames front and back card portions automatically. Use the draggable handles to adjust framing if your scan is tilted or off-center.",
      },
      {
        step: 3,
        title: "Apply Contrast & Text Sharpening",
        description:
          "Enhance QR code scannability and demographic text clarity using calibrated contrast filters designed specifically for thermal and inkjet card printing.",
      },
      {
        step: 4,
        title: "Download Print-Ready PDF or PNG",
        description:
          "Export calibrated 300 DPI single-page A4 layouts with front and back sides placed side-by-side, or save standalone high-resolution PNGs ready for PVC card trays.",
      },
    ],
    faqs: [
      {
        question: "How do I crop a password-protected e-Aadhaar PDF?",
        answer:
          "Upload your official UIDAI PDF and enter your standard password when prompted: the first four letters of your name in CAPITAL letters followed by your four-digit birth year (e.g., SURE1990). Decryption happens 100% locally in your browser memory—no file or password is ever sent over the internet.",
      },
      {
        question: "What are the exact dimensions for PVC Aadhaar card printing?",
        answer:
          "Standard physical ID cards follow ISO/IEC 7810 ID-1 (CR80) dimensions: 85.60 mm wide by 53.98 mm high (3.370 × 2.125 inches) with a 3.18 mm corner radius. Our tool exports at 300 DPI so printed cards fit perfectly into plastic sleeves and cardholders.",
      },
      {
        question: "Is my biometric and Aadhaar number safe when using this tool?",
        answer:
          "Absolutely. Print Ready Designs operates strictly client-side via WebAssembly and HTML5 Canvas. Your Aadhaar document, photo, QR code, and 12-digit UID number never leave your computer or smartphone.",
      },
      {
        question: "Can I print both front and back sides on a single A4 page?",
        answer:
          "Yes. The tool automatically arranges both front and back card segments side-by-side with alignment cutting guidelines, perfectly scaled for standard A4 photo paper or PVC tray printers.",
      },
    ],
    relatedTools: [
      {
        toolId: "pan-card-crop",
        title: "Free PAN Card Crop Tool",
        href: "/tools/pan-card-crop",
        description: "Crop NSDL & UTI e-PAN cards to exact ISO ID-1 PVC card dimensions.",
      },
      {
        toolId: "document-studio",
        title: "Free Document Studio",
        href: "/tools/document-studio",
        description: "All-in-one multi-card workspace for Voter ID, Aadhaar, PAN, and custom cards.",
      },
      {
        toolId: "document-straightener",
        title: "Free Document Straightener",
        href: "/tools/document-straightener",
        description: "Fix tilted mobile camera snapshots of ID documents using 4-corner perspective unwarping.",
      },
      {
        toolId: "photo-studio",
        title: "Free Passport Photo Studio",
        href: "/tools/photo-studio",
        description: "Generate compliant 35×45mm Indian passport photos with solid backgrounds.",
      },
    ],
  },

  "pan-card-crop": {
    toolId: "pan-card-crop",
    h1: "Free Online PAN Card Crop Tool – NSDL & UTI Card Size",
    seoTitle: "Free PAN Card Crop Tool Online – NSDL & UTI PVC Print Size | Print Ready Designs",
    metaDescription:
      "Crop NSDL and UTIITSL e-PAN cards or scanned photos to standard ISO ID-1 PVC wallet card size (85.6 × 53.98 mm). Local password unlock, signature clarity boost, and 300 DPI print-ready PDF export.",
    primaryKeyword: "PAN card crop tool online",
    keywords: [
      "PAN card crop tool online",
      "free pan card cropper",
      "nsdl e-pan crop online",
      "uti pan card pvc print size",
      "crop pan card front and back",
      "pan card print ready a4 pdf",
      "pan card cr80 dimensions",
    ],
    intro:
      "Extract and crop front and back sides of scanned PAN cards or e-PAN PDFs (NSDL & UTIITSL) to exact standard ISO ID-1 wallet dimensions (85.6 × 53.98 mm). Unlock password-protected PDFs locally and generate 300 DPI high-resolution print layouts formatted for direct PVC card printing and lamination.",
    howToUse: [
      {
        step: 1,
        title: "Upload Scanned Image or e-PAN PDF",
        description:
          "Select your NSDL or UTIITSL e-PAN PDF or mobile photograph. If password-protected, enter your Date of Birth in DDMMYYYY format to unlock in-browser.",
      },
      {
        step: 2,
        title: "Align Front & Back Crop Frames",
        description:
          "Our system isolates the PAN card boundary. Fine-tune the front and back bounding boxes to ensure the photo, signature strip, and Income Tax QR code are centered.",
      },
      {
        step: 3,
        title: "Enhance Signature & QR Code",
        description:
          "Apply specialized contrast adjustment to sharpen microtext, signature strokes, and high-density QR barcodes for seamless official verification.",
      },
      {
        step: 4,
        title: "Export Print-Ready PDF or PNG",
        description:
          "Download a calibrated 1:1 scale A4 sheet containing both sides or export individual high-resolution PNGs ready for thermal PVC card printers.",
      },
    ],
    faqs: [
      {
        question: "Does this tool support both NSDL and UTIITSL e-PAN PDFs?",
        answer:
          "Yes. It accurately parses both NSDL and UTIITSL digital e-PAN PDF formats as well as photographed physical PAN cards, automatically identifying the card area.",
      },
      {
        question: "What is the standard physical PAN card print size?",
        answer:
          "Official Indian PAN cards follow the international ISO/IEC 7810 ID-1 (CR80) standard: 85.60 mm wide by 53.98 mm high. Our exported layouts render at true 300 DPI matching these exact dimensions.",
      },
      {
        question: "How do I unlock a password-protected e-PAN PDF?",
        answer:
          "The password for e-PAN PDFs issued by NSDL and UTIITSL is your Date of Birth formatted as DDMMYYYY (e.g., 15081995 for 15 August 1995). The file is decrypted locally inside your browser without any network transmission.",
      },
      {
        question: "Will the applicant's signature and QR code print clearly?",
        answer:
          "Yes. Our canvas rendering pipeline maintains native vector sharpness for PDFs and applies smart contrast enhancement to prevent blurry signatures and unreadable QR codes.",
      },
    ],
    relatedTools: [
      {
        toolId: "aadhaar-card-crop",
        title: "Free Aadhaar Card Crop Tool",
        href: "/tools/aadhaar-card-crop",
        description: "Crop e-Aadhaar PDF letters into standard PVC wallet card size.",
      },
      {
        toolId: "document-studio",
        title: "Free Document Studio",
        href: "/tools/document-studio",
        description: "Dual-side workspace for Voter ID, Aadhaar, PAN, and custom documents.",
      },
      {
        toolId: "multiple-photo-maker",
        title: "Free Multiple Photo Maker",
        href: "/tools/multiple-photo-maker",
        description: "Arrange multiple passport photos on A4 and 4×6 inch print sheets.",
      },
      {
        toolId: "document-straightener",
        title: "Free Document Straightener",
        href: "/tools/document-straightener",
        description: "Fix tilted mobile camera snapshots of documents using 4-corner perspective unwarping.",
      },
    ],
  },

  "ration-card-crop": {
    toolId: "ration-card-crop",
    h1: "Free Online Digital Ration Card Crop Tool",
    seoTitle: "Free Digital Ration Card Cropper Online – PVC & Lamination Print Size | Print Ready Designs",
    metaDescription:
      "Crop digital Ration Card PDFs and slips into standard pocket or wallet card print layouts. Contrast enhancement for thermal text, barcode retention, and direct A4 print PDF export.",
    primaryKeyword: "digital ration card PVC print",
    keywords: [
      "digital ration card PVC print",
      "free ration card crop tool",
      "e-ration card cropper online",
      "ration card lamination print size",
      "digital ration slip crop pdf",
      "ration card wallet card layout",
    ],
    intro:
      "Crop and standardize digital Ration Card printouts, NFSA slips, and state e-Ration documents into clean, durable wallet-sized or folding pocket cards. Enhance low-contrast thermal text and preserve family member details and QR barcodes with 100% private in-browser processing.",
    howToUse: [
      {
        step: 1,
        title: "Upload Ration Document or Slip",
        description:
          "Upload your state food department digital ration card PDF or smartphone photo (supporting NFSA, West Bengal, Bihar, UP, Maharashtra, and other state portals).",
      },
      {
        step: 2,
        title: "Adjust Card Crop Boundaries",
        description:
          "Frame the card header, family head details, ration card number, and beneficiary list within the adjustable crop window.",
      },
      {
        step: 3,
        title: "Boost Contrast & Readability",
        description:
          "Use the built-in greyscale and contrast boost filters to make faded dot-matrix or thermal print text crisp and readable.",
      },
      {
        step: 4,
        title: "Download Print-Ready PDF",
        description:
          "Export calibrated A4 sheets configured for side-by-side folding cards or PVC pocket card size, ready for thermal lamination.",
      },
    ],
    faqs: [
      {
        question: "Which state digital ration cards are supported?",
        answer:
          "Our tool works with all Indian state food portals (NFSA, West Bengal Digital Ration Card, UP Ration Slip, Bihar ePDS, Maharashtra, Tamil Nadu, and others) as well as scanned physical ration booklets.",
      },
      {
        question: "Can I adjust contrast to make faded prints readable?",
        answer:
          "Yes. Many digital ration slips and thermal POS printouts have faded text. The built-in contrast and greyscale filters significantly increase text separation and barcode readability.",
      },
      {
        question: "Can I fold the printed ration card into wallet size?",
        answer:
          "Yes. You can select either a standard CR80 wallet card size or a bi-fold pocket layout that keeps all family member listings intact while folding neatly into a standard wallet sleeve.",
      },
      {
        question: "Are my family's ration details stored or logged on a server?",
        answer:
          "No. All image processing and PDF rendering execute strictly inside your web browser. No document data, ration card numbers, or names are ever uploaded to any external server.",
      },
    ],
    relatedTools: [
      {
        toolId: "aadhaar-card-crop",
        title: "Free Aadhaar Card Crop Tool",
        href: "/tools/aadhaar-card-crop",
        description: "Crop e-Aadhaar PDF letters into standard PVC wallet card size.",
      },
      {
        toolId: "document-studio",
        title: "Free Document Studio",
        href: "/tools/document-studio",
        description: "Multi-document studio for Voter ID, Aadhaar, PAN, Ration, and custom cards.",
      },
      {
        toolId: "document-straightener",
        title: "Free Document Straightener",
        href: "/tools/document-straightener",
        description: "Straighten tilted smartphone document photos with 4-corner perspective correction.",
      },
      {
        toolId: "pan-card-crop",
        title: "Free PAN Card Crop Tool",
        href: "/tools/pan-card-crop",
        description: "Crop NSDL and UTI e-PAN cards to exact PVC card print size.",
      },
    ],
  },

  "photo-studio": {
    toolId: "photo-studio",
    h1: "Free Indian Passport Size Photo Maker – 35×45mm",
    seoTitle: "Indian Passport Photo Maker (35×45mm) & A4 Print Sheet | Print Ready Designs",
    metaDescription:
      "Create official Indian passport photos (35×45mm), visa portraits, and stamp-size prints online for free. Custom backdrops, 70-80% face framing, Name & Date imprint, and 300 DPI print sheets.",
    primaryKeyword: "Indian passport size photo maker 35x45mm",
    keywords: [
      "Indian passport size photo maker 35x45mm",
      "free passport photo maker online",
      "35x45 mm photo creator",
      "indian passport photo online free",
      "visa photo maker 35x45mm",
      "passport photo with name and date",
      "300 dpi passport print sheet",
    ],
    intro:
      "Create compliant Indian passport photos (35 × 45 mm), US/Schengen visa portraits, and stamp-size prints in seconds. Align your photo to official biometric guidelines with 70–80% face coverage, customize plain white or light blue backdrops, add optional Name & Date labels, and export 300 DPI print-ready sheets.",
    howToUse: [
      {
        step: 1,
        title: "Upload Portrait Photograph",
        description:
          "Upload a clear front-facing portrait photo taken in good lighting against any background (JPEG, PNG, or WebP).",
      },
      {
        step: 2,
        title: "Align to Biometric Crop Guide",
        description:
          "Use the on-screen facial guide oval to frame your face between 70% and 80% of the total frame height, ensuring eyes and chin align with standard biometric rules.",
      },
      {
        step: 3,
        title: "Select Backdrop & Add Imprint",
        description:
          "Choose standard plain white, off-white, or light blue backdrops. Optionally add your Name and Date of Photo (DOPO) footer for competitive government exam requirements.",
      },
      {
        step: 4,
        title: "Download Single Photo or Print Sheet",
        description:
          "Download a single 35×45mm image file for online applications or generate tiled A4, 4×6 inch, or 5×7 inch print sheets with cut guidelines for photo studio printing.",
      },
    ],
    faqs: [
      {
        question: "What is the official size for an Indian passport photo?",
        answer:
          "The official size mandated by the Ministry of External Affairs (CPV Division) is 35 mm wide by 45 mm high (3.5 × 4.5 cm). The applicant's face must occupy 70% to 80% of the vertical frame (31 mm to 36 mm from chin to crown).",
      },
      {
        question: "Can I add my name and date of photograph to the image?",
        answer:
          "Yes. Many Indian government and recruitment exams (such as SSC, UPSC, State PSCs) require applicant name and date of photograph printed on the bottom margin. Our tool includes an easy one-click Name & Date imprint feature.",
      },
      {
        question: "What background color is required for passport and visa applications?",
        answer:
          "Indian passports and most visas require a plain white or light off-white background with no shadows or patterns. Some specific IDs allow light blue. You can toggle between white and light blue backdrops instantly.",
      },
      {
        question: "What is the recommended resolution for photo lab printing?",
        answer:
          "All exported photos and print sheets are calibrated at 300 DPI (dots per inch), ensuring studio-quality sharpness when printed on standard glossy or matte photo paper at local labs or home inkjet printers.",
      },
    ],
    relatedTools: [
      {
        toolId: "multiple-photo-maker",
        title: "Free Multiple Photo Maker",
        href: "/tools/multiple-photo-maker",
        description: "Arrange multiple passport copies on A4 and 4×6 photo sheets with cutting guides.",
      },
      {
        toolId: "background-remover",
        title: "Free Background Remover",
        href: "/tools/background-remover",
        description: "Remove image backgrounds automatically with client-side AI neural networks.",
      },
      {
        toolId: "photo-editor",
        title: "Free Advanced Photo Editor",
        href: "/tools/photo-editor",
        description: "Adjust brightness, contrast, crop aspect ratios, and compress image file size.",
      },
      {
        toolId: "resume-maker",
        title: "Free Resume / CV Maker",
        href: "/tools/resume-maker",
        description: "Build clean, ATS-friendly resumes with instant vector PDF download.",
      },
    ],
  },

  "multiple-photo-maker": {
    toolId: "multiple-photo-maker",
    h1: "Free Multiple Passport Photo Maker – A4 & 4×6 Sheets",
    seoTitle: "Free Passport Photo Sheet Maker – A4 & 4×6 Printing | Print Ready Designs",
    metaDescription:
      "Arrange multiple passport photos on standard A4, 4×6, and 5×7 inch print sheets online for free. Custom spacing, cutting guide marks, true 1:1 scale calibration, and direct 300 DPI print export.",
    primaryKeyword: "passport photo sheet maker A4 4x6",
    keywords: [
      "passport photo sheet maker A4 4x6",
      "free multiple photo maker",
      "print passport photos on a4 sheet",
      "4x6 passport photo print template",
      "passport photo grid generator",
      "tile passport photos free",
      "multiple photo printing online",
    ],
    intro:
      "Tile and arrange multiple passport photo copies on standard A4, 4×6 inch, and 5×7 inch photo print sheets. Configure exact copy counts (4, 8, 12, 16, or 32 photos), adjust horizontal and vertical gaps, enable cutting guide lines for easy scissors trimming, and export 1:1 scale 300 DPI files for home or photo lab printing.",
    howToUse: [
      {
        step: 1,
        title: "Upload Your Passport Photo",
        description:
          "Upload your cropped 35×45mm passport or visa photograph in JPEG, PNG, or WebP format.",
      },
      {
        step: 2,
        title: "Choose Print Paper Size",
        description:
          "Select your target paper format: standard 4×6 inch (postcard size, popular for budget lab printing), A4 (letter size for high-volume batches), or 5×7 inch.",
      },
      {
        step: 3,
        title: "Set Photo Count & Cutting Guides",
        description:
          "Choose how many photo copies you need. Enable cutting lines and fine-tune margins and inter-photo spacing so trimming with scissors or paper shears is effortless.",
      },
      {
        step: 4,
        title: "Download Print-Ready PDF or PNG",
        description:
          "Export your calibrated 300 DPI sheet. When printing, select '100% / Actual Size' in your printer settings for accurate physical dimensions.",
      },
    ],
    faqs: [
      {
        question: "How many passport photos can fit on a 4×6 inch sheet?",
        answer:
          "A standard 4×6 inch photo paper comfortably fits 6 to 8 standard 35×45mm passport photos with adequate spacing and cutting margins. On an A4 sheet, you can fit up to 30 to 35 photos.",
      },
      {
        question: "Why are cutting guide lines useful?",
        answer:
          "Cutting lines place thin, high-contrast markers between adjacent photographs. When printing at home or in a studio, these lines guide scissors or guillotine cutters so every photo is trimmed to exact dimensions.",
      },
      {
        question: "How do I ensure photos print at true 1:1 scale without shrinking?",
        answer:
          "Our sheets are calibrated at exact 300 DPI physical measurements. When opening your printer dialog, ensure 'Fit to Page' or 'Scale to Fit' is disabled, and choose 'Actual Size' or '100% Scale'.",
      },
      {
        question: "Can I save money printing at local photo labs with this tool?",
        answer:
          "Yes! Local studios and online photo labs often charge high rates for 'passport sets', but very little for a standard 4×6 photo print. By generating your own 4×6 sheet with 6-8 photos, you save up to 80% on printing costs.",
      },
    ],
    relatedTools: [
      {
        toolId: "photo-studio",
        title: "Free Passport Photo Studio",
        href: "/tools/photo-studio",
        description: "Create official Indian 35×45mm passport photos and visa portraits.",
      },
      {
        toolId: "photo-editor",
        title: "Free Advanced Photo Editor",
        href: "/tools/photo-editor",
        description: "Crop, rotate, adjust tone, and compress photos in browser memory.",
      },
      {
        toolId: "background-remover",
        title: "Free Background Remover",
        href: "/tools/background-remover",
        description: "Remove image backgrounds with local neural networks in seconds.",
      },
      {
        toolId: "document-studio",
        title: "Free Document Studio",
        href: "/tools/document-studio",
        description: "Workspace for cropping Voter ID, PAN, Aadhaar, and custom cards.",
      },
    ],
  },

  "document-straightener": {
    toolId: "document-straightener",
    h1: "Free Document Straightener – Turn Crooked Photos into Print-Ready Documents",
    seoTitle: "Free Document Straightener – Fix Crooked Photos & Create PDF | Print Ready Designs",
    metaDescription:
      "Correct crooked, tilted, and perspective-distorted document photographs into clean rectangular images. Precision 4-corner homography unwarping, contrast enhancement, and direct print PDF export.",
    primaryKeyword: "crooked document photo to straight PDF",
    keywords: [
      "crooked document photo to straight PDF",
      "free document straightener",
      "perspective correction online",
      "unskew document photo",
      "4 corner perspective warp",
      "straighten document camera scan",
      "whatsapp document photo to pdf",
    ],
    intro:
      "Turn skewed smartphone photographs and tilted WhatsApp snapshots of documents into crisp, flat, rectangular pages. Use our interactive 4-corner perspective unwarping tool with precision circular magnifying loupe, dual-side front & back processing, and scan-contrast enhancement for print-ready PDFs.",
    howToUse: [
      {
        step: 1,
        title: "Upload Tilted or Crooked Photo",
        description:
          "Upload any photograph of a document, certificate, or ID card taken at an angle with a mobile camera (JPEG, PNG, or WebP).",
      },
      {
        step: 2,
        title: "Position the 4 Corner Pins",
        description:
          "Drag the four corner pins to the physical edges of the paper. Use the built-in circular magnifying loupe for pixel-perfect placement.",
      },
      {
        step: 3,
        title: "Choose Output Ratio & Enhancement",
        description:
          "Select standard document proportions (A4, ID-1 card, or auto) and apply document contrast enhancement to whiten grey backgrounds and darken text.",
      },
      {
        step: 4,
        title: "Export Rectified PDF or PNG",
        description:
          "Download your straightened, flattened document as a high-resolution PNG or print-ready PDF with zero server uploads.",
      },
    ],
    faqs: [
      {
        question: "How does 4-corner perspective correction work?",
        answer:
          "When you photograph a document from an angle, perspective distortion causes it to appear as an irregular quadrilateral. Our tool computes an exact mathematical homography matrix to unwarp that quadrilateral into a true rectangular image.",
      },
      {
        question: "Can it fix documents photographed on desks or textured surfaces?",
        answer:
          "Yes. The precision circular magnifying loupe shows a magnified view under your cursor, making it easy to align pins with paper corners even against cluttered desks, wooden tables, or patterned bedsheets.",
      },
      {
        question: "Does it improve dark shadows and grey paper backgrounds?",
        answer:
          "Yes. Our document scan enhancement pipeline applies adaptive thresholding and contrast boosting to remove uneven smartphone shadows, leaving dark text on clean white paper.",
      },
      {
        question: "Are my sensitive certificates or contracts kept private?",
        answer:
          "100% private. All homography transformations and image processing run locally on your device's GPU and CPU via HTML5 Canvas. Your documents are never uploaded anywhere.",
      },
    ],
    relatedTools: [
      {
        toolId: "document-studio",
        title: "Free Document Studio",
        href: "/tools/document-studio",
        description: "All-in-one cropping workspace for Voter ID, Aadhaar, PAN, and custom cards.",
      },
      {
        toolId: "aadhaar-card-crop",
        title: "Free Aadhaar Card Crop Tool",
        href: "/tools/aadhaar-card-crop",
        description: "Crop e-Aadhaar PDF letters into standard PVC wallet card size.",
      },
      {
        toolId: "pan-card-crop",
        title: "Free PAN Card Crop Tool",
        href: "/tools/pan-card-crop",
        description: "Crop NSDL and UTI e-PAN cards to exact PVC card print size.",
      },
      {
        toolId: "photo-editor",
        title: "Free Advanced Photo Editor",
        href: "/tools/photo-editor",
        description: "Crop, rotate, adjust tone, and compress photos in browser memory.",
      },
    ],
  },

  "background-remover": {
    toolId: "background-remover",
    h1: "Free Online AI Background Remover",
    seoTitle: "Free AI Image Background Remover Online – Print Ready Designs",
    metaDescription:
      "Remove image backgrounds 100% free with local in-browser AI neural networks. Clean edge detection around hair & clothing, transparent PNG download, solid backdrops, and zero server uploads.",
    primaryKeyword: "free AI image background remover",
    keywords: [
      "free AI image background remover",
      "remove image background online free",
      "in-browser background removal",
      "transparent png maker online",
      "id photo white background maker",
      "client side ai background remover",
      "local neural network cutout",
    ],
    intro:
      "Isolate portrait subjects and remove image backgrounds automatically using browser-compiled AI neural networks. Enjoy clean edge detection around hair, clothing, and accessories with zero server uploads, zero subscription fees, transparent PNG export, and instant white or light blue backdrops for passport photos.",
    howToUse: [
      {
        step: 1,
        title: "Upload Your Photo",
        description:
          "Select any portrait, product, or pet photograph in JPG, PNG, or WebP format from your device.",
      },
      {
        step: 2,
        title: "Instant In-Browser AI Cutout",
        description:
          "Our on-device neural network segments the subject in seconds without uploading your photo to any cloud server.",
      },
      {
        step: 3,
        title: "Select Backdrop Style",
        description:
          "Keep the background transparent, or switch to solid white, off-white, light blue, or custom colors to meet government ID criteria.",
      },
      {
        step: 4,
        title: "Download Full-Resolution PNG",
        description:
          "Download your cutout in lossless PNG format with smooth anti-aliased alpha borders ready for documents, design projects, or passport sheets.",
      },
    ],
    faqs: [
      {
        question: "Are my photos uploaded to a cloud server?",
        answer:
          "No. Unlike cloud-based background removers that upload your photos to external servers, Print Ready Designs runs the entire AI segmentation model locally inside your web browser using WebAssembly. Your images never leave your computer or phone.",
      },
      {
        question: "How does the AI handle fine details like hair and glasses?",
        answer:
          "Our segmentation model uses high-resolution alpha matting that accurately distinguishes fine strands of hair, spectacles, collars, and shoulders from complex or cluttered backgrounds.",
      },
      {
        question: "Can I add a white or light blue background for passport applications?",
        answer:
          "Yes. With one click, you can swap the transparent background for solid white or light blue, making the resulting photo fully compliant with passport, visa, and exam portal requirements.",
      },
      {
        question: "Is there any usage limit, paywall, or watermark?",
        answer:
          "No. The tool is 100% free with no daily limits, no account creation required, and zero watermarks on your downloaded images.",
      },
    ],
    relatedTools: [
      {
        toolId: "photo-studio",
        title: "Free Passport Photo Studio",
        href: "/tools/photo-studio",
        description: "Create compliant 35×45mm Indian passport photos with solid backgrounds.",
      },
      {
        toolId: "multiple-photo-maker",
        title: "Free Multiple Photo Maker",
        href: "/tools/multiple-photo-maker",
        description: "Arrange multiple passport copies on A4 and 4×6 photo sheets with cutting guides.",
      },
      {
        toolId: "photo-editor",
        title: "Free Advanced Photo Editor",
        href: "/tools/photo-editor",
        description: "Adjust brightness, contrast, crop aspect ratios, and compress image file size.",
      },
      {
        toolId: "resume-maker",
        title: "Free Resume / CV Maker",
        href: "/tools/resume-maker",
        description: "Build clean, ATS-friendly resumes with instant vector PDF download.",
      },
    ],
  },

  "resume-maker": {
    toolId: "resume-maker",
    h1: "Free ATS-Friendly Resume & CV Maker",
    seoTitle: "Free ATS-Friendly Resume Maker Online India – PDF Builder | Print Ready Designs",
    metaDescription:
      "Build clean, modern, ATS-friendly resumes online for free. Real-time preview, ATS-optimized layout templates, structured job sections, and instant client-side vector PDF generation.",
    primaryKeyword: "free ATS-friendly resume maker online India",
    keywords: [
      "free ATS-friendly resume maker online India",
      "ats friendly resume builder free",
      "free online cv maker india",
      "vector pdf resume generator",
      "ats resume template for freshers",
      "privacy first resume builder",
      "job ready cv maker no signup",
    ],
    intro:
      "Craft professional, ATS-compliant resumes with structured sections for education, skills, work experience, and projects. Preview changes live and export crisp, selectable-text vector PDFs rendered directly in your browser without account signups, subscriptions, or data storage.",
    howToUse: [
      {
        step: 1,
        title: "Enter Your Career Details",
        description:
          "Fill in your contact information, professional summary, work experience, education history, technical skills, and projects in structured forms.",
      },
      {
        step: 2,
        title: "Select ATS-Friendly Template",
        description:
          "Choose from clean single-column or dual-column ATS-tested layouts optimized for applicant tracking systems used by Indian and international recruiters.",
      },
      {
        step: 3,
        title: "Inspect Real-Time Preview",
        description:
          "Review your resume layout side-by-side with real-time typography, spacing, and page-break adjustments to ensure a polished visual balance.",
      },
      {
        step: 4,
        title: "Download True Vector PDF",
        description:
          "Export your resume as a clean vector PDF with fully selectable, machine-readable text and zero third-party branding.",
      },
    ],
    faqs: [
      {
        question: "What makes a resume ATS-friendly?",
        answer:
          "Applicant Tracking Systems (ATS) scan resumes for keywords and parse text hierarchically. Our templates use standard heading tags, clean linear formatting, and true vector text (not flattened images) so parsers can easily extract your qualifications without errors.",
      },
      {
        question: "Do I need to create an account or pay to download?",
        answer:
          "No. Print Ready Designs requires zero sign-up, no credit card, and no subscription. You can create and download as many resumes as you need completely free.",
      },
      {
        question: "Can I save my resume progress and edit later?",
        answer:
          "Yes. Your resume data is saved automatically in your browser's private local storage, so when you return from the same device, your work is right where you left it.",
      },
      {
        question: "Is my personal contact and career information kept private?",
        answer:
          "Yes, completely. Unlike other resume builders that store resumes in remote databases, your personal data stays 100% inside your own web browser.",
      },
    ],
    relatedTools: [
      {
        toolId: "photo-studio",
        title: "Free Passport Photo Studio",
        href: "/tools/photo-studio",
        description: "Create professional portrait photos for job applications and profiles.",
      },
      {
        toolId: "document-studio",
        title: "Free Document Studio",
        href: "/tools/document-studio",
        description: "All-in-one workspace for cropping Voter ID, Aadhaar, PAN, and certificates.",
      },
      {
        toolId: "photo-editor",
        title: "Free Advanced Photo Editor",
        href: "/tools/photo-editor",
        description: "Crop, enhance, and optimize photo file sizes for job portal uploads.",
      },
      {
        toolId: "multiple-photo-maker",
        title: "Free Multiple Photo Maker",
        href: "/tools/multiple-photo-maker",
        description: "Arrange multiple passport photos on A4 sheets for walk-in interview prints.",
      },
    ],
  },

  "photo-editor": {
    toolId: "photo-editor",
    h1: "Free Online Advanced Photo Editor",
    seoTitle: "Free Advanced Photo Editor Online – Crop, Adjust & Compress | Print Ready Designs",
    metaDescription:
      "Free online photo editor for cropping, rotating, tone adjustments, and compressing pictures to exact file size limits (under 20KB, 50KB, 100KB) directly in browser memory.",
    primaryKeyword: "free online photo editor crop compress",
    keywords: [
      "free online photo editor crop compress",
      "compress photo to 50kb online",
      "crop photo for exam application",
      "online image tone adjustment",
      "privacy photo editor browser memory",
      "compress picture for government portal",
    ],
    intro:
      "Crop, rotate, enhance tone, and compress photos to exact file size limits (e.g., under 20KB, 50KB, or 100KB for government job portals) directly in your web browser. Enjoy non-destructive adjustments, high-precision canvas rendering, and zero server uploads.",
    howToUse: [
      {
        step: 1,
        title: "Upload Image File",
        description:
          "Open any JPEG, PNG, or WebP photo from your device directly into the high-performance browser canvas.",
      },
      {
        step: 2,
        title: "Crop & Rotate",
        description:
          "Crop to freeform or fixed aspect ratios (1:1, 4:5, 16:9, etc.) and rotate or flip your image to correct orientation.",
      },
      {
        step: 3,
        title: "Adjust Brightness & Tone",
        description:
          "Fine-tune exposure, contrast, saturation, and sharpness using smooth slider controls with real-time visual feedback.",
      },
      {
        step: 4,
        title: "Compress to Exact KB Size",
        description:
          "Select a target file size (e.g., under 50KB for UPSC, SSC, or college admissions) and download your optimized image instantly.",
      },
    ],
    faqs: [
      {
        question: "Can I compress photos to meet government portal upload limits?",
        answer:
          "Yes. Many government job portals (such as SSC, UPSC, State PSCs, and banking exams) mandate photos below 50 KB or 20 KB. Our built-in compressor allows you to hit exact target file size thresholds while preserving maximum clarity.",
      },
      {
        question: "Are image adjustments non-destructive?",
        answer:
          "Yes. All adjustments are calculated dynamically on the original image buffer in browser memory, meaning you can reset, tweak, or re-crop without cumulative quality degradation.",
      },
      {
        question: "What image formats can I upload and export?",
        answer:
          "You can upload JPEG, PNG, and WebP files. You can export in standard JPEG, PNG, or optimized WebP with customizable compression quality.",
      },
      {
        question: "Are my photos uploaded to any server?",
        answer:
          "No. All image processing runs strictly within your browser's HTML5 Canvas environment. Zero bytes are uploaded to external servers.",
      },
    ],
    relatedTools: [
      {
        toolId: "photo-studio",
        title: "Free Passport Photo Studio",
        href: "/tools/photo-studio",
        description: "Create official 35×45mm passport photos and visa portraits.",
      },
      {
        toolId: "background-remover",
        title: "Free Background Remover",
        href: "/tools/background-remover",
        description: "Remove image backgrounds automatically using local AI neural networks.",
      },
      {
        toolId: "multiple-photo-maker",
        title: "Free Multiple Photo Maker",
        href: "/tools/multiple-photo-maker",
        description: "Tile multiple passport photo copies on A4 and 4×6 print sheets.",
      },
      {
        toolId: "document-straightener",
        title: "Free Document Straightener",
        href: "/tools/document-straightener",
        description: "Fix tilted mobile camera snapshots of documents using 4-corner perspective unwarping.",
      },
    ],
  },

  "document-studio": {
    toolId: "document-studio",
    h1: "Free Online Document Studio – All-in-One ID & Certificate Cropper",
    seoTitle: "Free Document Studio Online – Crop Voter ID, PAN, Aadhaar & Custom Docs | Print Ready Designs",
    metaDescription:
      "All-in-one browser workspace for cropping and printing Voter ID (e-EPIC), PAN, Aadhaar, Ration cards, and custom ID certificates. Dual-side canvas, password unlock, and print-ready A4 PDF export.",
    primaryKeyword: "document studio crop id cards online",
    keywords: [
      "document studio crop id cards online",
      "voter id crop online",
      "e-epic card pvc print size",
      "custom id card cropper free",
      "front and back id card crop workspace",
      "dual side document cropping",
      "id card print layout generator",
    ],
    intro:
      "An all-in-one client-side document workspace to crop, enhance, and prepare Voter ID (e-EPIC), Aadhaar, PAN, Ration cards, and custom certificates for physical printing. Manage independent front and back sides in browser memory and export calibrated 300 DPI A4 sheets.",
    howToUse: [
      {
        step: 1,
        title: "Select Document Preset",
        description:
          "Choose your document type: Voter ID (e-EPIC), Aadhaar Card, PAN Card, Ration Card, or Custom Document with flexible aspect ratios.",
      },
      {
        step: 2,
        title: "Upload Front & Back Sides",
        description:
          "Upload your PDF or image files. For multi-page PDFs or dual-side cards, you can assign separate pages to front and back workspaces.",
      },
      {
        step: 3,
        title: "Fine-Tune Crop & Enhancement",
        description:
          "Adjust crop boundaries to match standard card dimensions, rotate if needed, and apply contrast filters to make text and barcodes vivid.",
      },
      {
        step: 4,
        title: "Export Print-Ready PDF",
        description:
          "Download a combined single-sheet A4 PDF with front and back sides placed side-by-side with alignment cutting guidelines ready for printing.",
      },
    ],
    faqs: [
      {
        question: "How do I crop Voter ID (e-EPIC) cards for PVC printing?",
        answer:
          "Select the Voter ID preset, upload your downloaded e-EPIC PDF or scanned card, and the tool will frame the standard Election Commission ID card boundaries. You can crop front and back sides and export a 300 DPI A4 layout for PVC card printing.",
      },
      {
        question: "Can I crop custom ID cards or certificates?",
        answer:
          "Yes. Selecting the Custom Document preset allows you to unlock fixed aspect ratios and freely crop any student ID, employee badge, certificate, or membership card.",
      },
      {
        question: "Can I process front and back sides independently?",
        answer:
          "Yes. The Document Studio provides independent workspace tabs for Front and Back sides, allowing you to crop, rotate, and enhance each side separately before combining them onto a single print sheet.",
      },
      {
        question: "Does Document Studio support password-protected PDFs?",
        answer:
          "Yes. If your document PDF requires a password (common with e-Aadhaar and e-PAN), an in-browser prompt allows you to unlock it locally with zero server transmission.",
      },
    ],
    relatedTools: [
      {
        toolId: "aadhaar-card-crop",
        title: "Free Aadhaar Card Crop Tool",
        href: "/tools/aadhaar-card-crop",
        description: "Crop e-Aadhaar PDF letters into standard PVC wallet card size.",
      },
      {
        toolId: "pan-card-crop",
        title: "Free PAN Card Crop Tool",
        href: "/tools/pan-card-crop",
        description: "Crop NSDL & UTI e-PAN cards to exact ISO ID-1 PVC card dimensions.",
      },
      {
        toolId: "ration-card-crop",
        title: "Free Ration Card Crop Tool",
        href: "/tools/ration-card-crop",
        description: "Crop and standardize digital Ration Card documents and slips.",
      },
      {
        toolId: "document-straightener",
        title: "Free Document Straightener",
        href: "/tools/document-straightener",
        description: "Straighten tilted smartphone document photos with 4-corner perspective correction.",
      },
    ],
  },
  "raw-image-to-pdf": {
    toolId: "raw-image-to-pdf",
    h1: "Free Online Raw Image to Clean PDF Converter – Multi-Photo Document Maker",
    seoTitle:
      "Free Raw Image to Clean PDF Converter – Multi-Photo to A4 PDF | Print Ready Designs",
    metaDescription:
      "Convert multiple photos of paper documents, receipts, and notes into clean, straightened A4 PDFs online. Reorder pages, enhance contrast, crop perspective, and export 100% in-browser with zero uploads.",
    primaryKeyword: "image to PDF converter",
    keywords: [
      "image to PDF converter",
      "convert photos to PDF",
      "multiple images to PDF",
      "JPG to PDF converter free",
      "PNG to PDF online",
      "scan documents to PDF",
      "clean image to PDF",
      "photo to PDF converter",
      "camera photo to clean PDF",
      "multi page document PDF maker",
    ],
    intro:
      "Transform smartphone photos of paper documents, receipts, contracts, and study notes into crisp, multi-page A4 PDFs directly in your browser. Correct 4-corner perspective distortion, optimize contrast for printer clarity, arrange page sequences, and generate professional documents with 100% client-side privacy.",
    howToUse: [
      {
        step: 1,
        title: "Upload Up to 10 Document Photos",
        description:
          "Select up to 10 photos (JPG, PNG, or WebP) of physical paperwork, bills, receipts, or notes taken with your phone or camera.",
      },
      {
        step: 2,
        title: "Crop Perspective & Straighten",
        description:
          "Use the interactive 4-point corner handles to eliminate skew and perspective distortion, producing flat, scanner-like rectangular pages.",
      },
      {
        step: 3,
        title: "Enhance Contrast & Adjust Readability",
        description:
          "Apply calibrated black-and-white or high-contrast filters to remove shadows, background noise, and brighten document text for clear printing.",
      },
      {
        step: 4,
        title: "Reorder Pages & Export Clean A4 PDF",
        description:
          "Drag to rearrange page sequences, verify thumbnail previews, and compile a standardized multi-page 300 DPI A4 PDF ready to download or print.",
      },
    ],
    faqs: [
      {
        question: "How does client-side image to PDF conversion work?",
        answer:
          "Images are processed directly within your browser's local memory using HTML5 Canvas and client-side PDF synthesis libraries. No image bytes or personal documents are uploaded to external cloud servers.",
      },
      {
        question: "Can I combine multiple JPG, PNG, and WebP images into one PDF?",
        answer:
          "Yes. You can upload up to 10 mixed JPG, PNG, and WebP photos. The tool compiles them into a single, cohesive multi-page A4 document with consistent margins and orientation.",
      },
      {
        question: "How does perspective cropping correct tilted smartphone photos?",
        answer:
          "The 4-corner perspective unwarping algorithm maps angled quadrilateral document corners into true right-angled rectangles, straightening keystoned phone photos into scanner-quality pages.",
      },
      {
        question: "Are my uploaded receipts or personal documents stored anywhere?",
        answer:
          "No. Zero server transmission or retention takes place. All images, perspective adjustments, and generated PDF pages exist only ephemerally in browser RAM and vanish when you close the tab.",
      },
    ],
    relatedTools: [
      {
        toolId: "document-straightener",
        title: "Free Document Straightener",
        href: "/tools/document-straightener",
        description:
          "Straighten tilted smartphone document photos with 4-corner perspective correction.",
      },
      {
        toolId: "document-studio",
        title: "Free Document Studio",
        href: "/tools/document-studio",
        description:
          "All-in-one studio to crop Aadhaar, PAN, Voter ID, Ration cards, and custom certificates.",
      },
      {
        toolId: "photo-studio",
        title: "Free Passport Photo Studio",
        href: "/tools/photo-studio",
        description:
          "Generate compliant passport and visa photos with standard dimensions and custom backdrops.",
      },
      {
        toolId: "multiple-photo-maker",
        title: "Free Multiple Photo Maker",
        href: "/tools/multiple-photo-maker",
        description:
          "Tile multiple passport photos across standard A4 and 4×6 photo print sheets.",
      },
    ],
  },
  "design-studio": {
    toolId: "design-studio",
    h1: "Free Online Design Studio – Printable Cards, Invitations & Covers",
    seoTitle:
      "Free Online Design Studio – Visiting Cards, Wedding Cards & Covers | Print Ready Designs",
    metaDescription:
      "Design professional visiting cards, wedding invitations, school/college project covers, and ID cards online. Customizable templates, editable canvas, and print-ready PDF export with zero uploads.",
    primaryKeyword: "online design studio",
    keywords: [
      "online design studio",
      "visiting card maker",
      "business card maker free",
      "wedding card maker online",
      "invitation card maker",
      "id card maker online",
      "project cover page maker",
      "online card design tool",
      "printable card designer",
      "free printable card maker",
    ],
    intro:
      "Create high-resolution, print-ready visiting cards, traditional and modern wedding invitations, academic project covers, and identity badges right inside your browser. Enjoy full creative control with a vector-backed canvas, customizable shapes, rich typography, photo uploads, cutting bleed guides, and multi-copy A4 print sheet generation—all completely private with zero server uploads.",
    howToUse: [
      {
        step: 1,
        title: "Choose a Template or Blank Canvas",
        description:
          "Pick from pre-formatted templates across Visiting Cards, Wedding Invitations, Project Covers, and ID Cards, or start with custom millimeter dimensions.",
      },
      {
        step: 2,
        title: "Customize Typography, Shapes & Colors",
        description:
          "Edit text headings, contact details, fonts, color palettes, and decorative borders using intuitive canvas controls with live alignment guides.",
      },
      {
        step: 3,
        title: "Insert Logos, Photos & Adjust Bleed",
        description:
          "Add personal logos or portrait photos locally, and review print bleed margins to guarantee critical text stays safely inside trimming boundaries.",
      },
      {
        step: 4,
        title: "Export Vector PDF or Multi-Card Print Sheet",
        description:
          "Download crisp 300 DPI vector PDFs, standalone PNGs, or generate multi-copy A4 layout sheets complete with cut marks for commercial or desktop printing.",
      },
    ],
    faqs: [
      {
        question: "What design categories and dimensions are supported in the Design Studio?",
        answer:
          "Design Studio supports 4 main categories: Standard Visiting Cards (3.5 × 2.0 in / 88.9 × 50.8 mm), Wedding & Ceremony Invitations (5.0 × 7.0 in / 127 × 177.8 mm), Academic Project Covers (A4 / 210 × 297 mm), and CR80 ID Badges (85.6 × 54.0 mm).",
      },
      {
        question: "Can I design double-sided cards with front and back layouts?",
        answer:
          "Yes. The studio enables seamless switching between front and back canvas surfaces, allowing you to design matching reverse sides for visiting cards and identity badges with aligned margins.",
      },
      {
        question: "How does multi-copy A4 print sheet generation work?",
        answer:
          "The export engine automatically tiles multiple copies of your finished card design across standard A4 paper with calibrated spacing and precision crop marks for easy guillotine trimming.",
      },
      {
        question: "Are my company logos, photos, or client details stored on a server?",
        answer:
          "No. The Design Studio operates 100% locally in your browser memory via Konva and Canvas APIs. No graphics, personal text, or template configurations are ever transmitted to any backend server.",
      },
    ],
    relatedTools: [
      {
        toolId: "document-studio",
        title: "Free Document Studio",
        href: "/tools/document-studio",
        description:
          "Crop Voter ID, PAN, Aadhaar, Ration cards, and custom certificates for PVC printing.",
      },
      {
        toolId: "photo-studio",
        title: "Free Passport Photo Studio",
        href: "/tools/photo-studio",
        description:
          "Generate compliant biometric passport and visa photos for identity applications.",
      },
      {
        toolId: "resume-maker",
        title: "Free ATS-Friendly Resume Maker",
        href: "/tools/resume-maker",
        description:
          "Build clean, machine-readable resumes and CVs with instant PDF export.",
      },
      {
        toolId: "multiple-photo-maker",
        title: "Free Multiple Photo Maker",
        href: "/tools/multiple-photo-maker",
        description:
          "Print multiple passport photos tiled across standard A4 and 4×6 photo sheets.",
      },
    ],
    categoryHighlights: [
      {
        title: "Visiting & Business Cards",
        subtitle: "Professional Networking & Brand Identity",
        dimensions: "3.5 × 2.0 in (88.9 × 50.8 mm)",
        description:
          "Craft modern corporate or entrepreneurial business cards with double-sided layouts, QR code placement, logo embedding, and multi-up A4 sheet printing.",
      },
      {
        title: "Wedding & Event Invitations",
        subtitle: "Traditional & Contemporary Celebration Stationery",
        dimensions: "5.0 × 7.0 in (127 × 177.8 mm)",
        description:
          "Design elegant wedding invites, engagement cards, and party stationery with ornamental borders, refined serif typography, and rich cultural color palettes.",
      },
      {
        title: "Academic & Project Front Covers",
        subtitle: "School, College & University Assignment Presentations",
        dimensions: "Standard A4 (210 × 297 mm)",
        description:
          "Format clean front covers for college practical files, dissertations, project reports, and school submissions with institutional seals and student details.",
      },
      {
        title: "Identity & Membership Cards",
        subtitle: "Standard CR80 Badges & Access Passes",
        dimensions: "ISO CR80 (85.6 × 54.0 mm)",
        description:
          "Produce crisp student IDs, corporate employee badges, and event entry passes featuring portrait photo placeholders, role badges, and barcode zones.",
      },
    ],
  },
};

/**
 * Retrieve SEO and educational content for a given tool ID.
 */
export function getToolSeoData(toolId: string): ToolSeoData | undefined {
  return TOOL_SEO_MAP[toolId];
}

/**
 * Generate Next.js page Metadata for a tool.
 */
export function generateToolMetadata(toolId: string): Metadata {
  const seo = getToolSeoData(toolId);
  if (!seo) {
    return {};
  }

  const toolUrl = `/tools/${toolId}`;

  return {
    title: {
      absolute: seo.seoTitle,
    },
    description: seo.metaDescription,
    keywords: seo.keywords,
    alternates: {
      canonical: toolUrl,
    },
    openGraph: {
      title: seo.seoTitle,
      description: seo.metaDescription,
      url: toolUrl,
      type: "website",
      siteName: "Print Ready Designs",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.seoTitle,
      description: seo.metaDescription,
    },
  };
}
