/**
 * Educational Guides & Tutorials Registry for Print Ready Designs.
 * 
 * Provides rich, high-value, crawlable guides for card cropping,
 * photo printing, perspective rectification, and ATS resumes.
 */

export interface GuideKeySpec {
  label: string;
  value: string;
}

export interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  tip?: string;
}

export interface GuideMistake {
  mistake: string;
  fix: string;
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface GuideRelatedTool {
  id: string;
  name: string;
  route: string;
  description: string;
  badge: string;
}

export interface GuideItem {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  category: "ID Card Printing" | "Passport Photos" | "Document Processing" | "Career Tools";
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  summary: string;
  introduction: string;
  keySpecs: GuideKeySpec[];
  steps: GuideStep[];
  commonMistakes: GuideMistake[];
  faqs: GuideFaq[];
  relatedTool: GuideRelatedTool;
  relatedGuides: string[]; // slugs
}

export const GUIDES: GuideItem[] = [
  {
    slug: "crop-aadhaar-card-pvc-printing",
    title: "How to Crop an e-Aadhaar Card for PVC Printing (Step-by-Step)",
    seoTitle: "How to Crop e-Aadhaar Card for PVC Printing (Step-by-Step) | Print Ready Designs",
    metaDescription:
      "Step-by-step guide to cropping official e-Aadhaar PDF letters into standard ISO ID-1 PVC wallet cards (85.6 × 53.98 mm). Password unlock, front/back alignment, and 300 DPI print setup.",
    primaryKeyword: "how to crop eaadhaar card for pvc print",
    category: "ID Card Printing",
    readTime: "5 min read",
    publishedAt: "2026-10-15",
    updatedAt: "2026-11-21",
    author: "Print Ready Designs Editorial Team",
    summary:
      "Learn how to extract, password-unlock, and crop front and back sides of official e-Aadhaar letters to standard ISO ID-1 dimensions (85.6 × 53.98 mm) for durable PVC card printing or lamination.",
    introduction:
      "Digital e-Aadhaar letters downloaded from UIDAI are delivered as full-page PDF documents containing applicant instructions, letterheads, and the official card segment at the bottom. To print a durable, wallet-sized PVC card or laminated card, you must accurately isolate both the front and back segments, unlock password protection, and configure the print layout to exact ISO/IEC 7810 ID-1 proportions. This guide walks you through the entire workflow using browser-based client-side tools that keep your biometric identity 100% private.",
    keySpecs: [
      { label: "Standard Card Size", value: "85.60 mm × 53.98 mm (ISO/IEC 7810 ID-1 / CR80)" },
      { label: "Corner Radius", value: "3.18 mm rounded corners" },
      { label: "Print Resolution", value: "300 DPI (1011 × 638 pixels per side)" },
      { label: "PDF Password Format", value: "First 4 letters of name in CAPITAL + 4-digit birth year (e.g. SURE1990)" },
      { label: "Recommended Paper", value: "230+ GSM glossy inkjet photo paper or PVC inkjet tray card" },
      { label: "Data Security", value: "Zero upload — 100% in-browser memory execution" },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Download Official e-Aadhaar PDF from UIDAI",
        description:
          "Visit the official UIDAI resident portal (myaadhaar.uidai.gov.in) and download your digitally signed e-Aadhaar letter. Save the PDF file to your local computer or smartphone.",
        tip: "Ensure your downloaded file ends in .pdf and has not been compressed or altered by messaging apps.",
      },
      {
        stepNumber: 2,
        title: "Upload & Unlock in Browser Memory",
        description:
          "Open the Free e-Aadhaar Card Crop Tool. Drag and drop your downloaded e-Aadhaar PDF. When prompted, enter your standard 8-character password. The document is unlocked strictly inside your browser's private WebAssembly memory without sending any bytes to external servers.",
        tip: "Remember that password characters must be in UPPERCASE followed directly by your 4-digit birth year without spaces.",
      },
      {
        stepNumber: 3,
        title: "Adjust Front and Back Crop Boundaries",
        description:
          "The tool's intelligent boundary detector automatically frames the lower card portion. Verify that the front box frames the applicant photograph, name, date of birth, gender, and 12-digit Aadhaar number, while the back box frames the complete address and secure demographic QR code.",
        tip: "Ensure the white border around the QR code is included so that point-of-sale scanner lasers can easily establish quiet zones.",
      },
      {
        stepNumber: 4,
        title: "Enhance Microtext & Export Print Layout",
        description:
          "Apply the contrast and sharpening filter to ensure the Government of India emblem, microtext borders, and QR barcode print crisp and dark. Click 'Download Print PDF' to generate an A4 sheet with front and back sides placed side-by-side with alignment guide marks.",
        tip: "When printing, select '100% / Actual Size' in your printer settings. Never use 'Fit to Page' or 'Shrink to Fit'.",
      },
    ],
    commonMistakes: [
      {
        mistake: "Printing with 'Fit to Page' enabled in printer dialog",
        fix: "Printers automatically scale down images to fit printable margins, shrinking the card by 5–8%. Always select 'Actual Size' or '100% Scale' in your print dialog so the physical card fits standard cardholder sleeves.",
      },
      {
        mistake: "Entering password letters in lowercase",
        fix: "UIDAI enforces uppercase letters for names. If your name is Ramesh born in 1985, enter RAME1985 (not rame1985).",
      },
      {
        mistake: "Cropping too tightly against the QR code edge",
        fix: "QR codes require a quiet margin of white space around all four edges. Leave at least 2–3 mm of breathing room around the QR code boundary.",
      },
    ],
    faqs: [
      {
        question: "Can I laminate an inkjet photo printout instead of buying a PVC card printer?",
        answer:
          "Yes. Many local print shops and individuals print the calibrated side-by-side layout on 200–250 GSM glossy photo paper, fold it down the center alignment line, and seal it inside a standard 250-micron PVC lamination pouch. This produces a stiff, water-resistant card indistinguishable from commercial PVC cards.",
      },
      {
        question: "Does the cropped e-Aadhaar QR code still scan successfully?",
        answer:
          "Yes. Because our tool exports at true 300 DPI and applies edge contrast enhancement without lossy re-sampling, mobile barcode reader apps (such as mAadhaar) can scan the QR code instantly.",
      },
      {
        question: "What if my name has only three letters?",
        answer:
          "UIDAI guidelines state that if your name has fewer than four letters (e.g., 'RAM'), you must use all letters of your name followed by your birth year (e.g., 'RAM1992').",
      },
      {
        question: "Is it safe to crop e-Aadhaar cards on public computers?",
        answer:
          "Print Ready Designs runs entirely client-side without storing files on any server. However, on public computers or internet cafes, always delete the downloaded PDF from the downloads folder and clear browser cache before leaving.",
      },
    ],
    relatedTool: {
      id: "aadhaar-card-crop",
      name: "Free e-Aadhaar Card Cropper",
      route: "/tools/aadhaar-card-crop",
      description: "Crop e-Aadhaar PDF letters into standard PVC wallet card size (85.6 × 53.98 mm) with zero uploads.",
      badge: "ISO ID-1",
    },
    relatedGuides: [
      "crop-pan-card-pvc-printing",
      "straighten-crooked-document-photo",
    ],
  },

  {
    slug: "crop-pan-card-pvc-printing",
    title: "How to Crop a PAN Card for PVC Printing (NSDL & UTIITSL)",
    seoTitle: "How to Crop PAN Card for PVC Printing – NSDL & UTI Guide | Print Ready Designs",
    metaDescription:
      "Learn how to crop NSDL and UTIITSL e-PAN PDFs or scanned cards to exact ISO CR80 PVC dimensions (85.6 × 53.98 mm). PDF unlock, signature clarity tips, and print settings.",
    primaryKeyword: "how to crop pan card for pvc printing",
    category: "ID Card Printing",
    readTime: "5 min read",
    publishedAt: "2026-10-18",
    updatedAt: "2026-11-21",
    author: "Print Ready Designs Editorial Team",
    summary:
      "Comprehensive instructions to prepare NSDL (Protean) and UTIITSL e-PAN cards for physical PVC printing with standard 85.6 × 53.98 mm dimensions, sharp signature enhancement, and 300 DPI output.",
    introduction:
      "Permanent Account Number (PAN) cards issued by the Income Tax Department through NSDL (Protean) and UTIITSL follow the international CR80 physical card standard. When downloading an e-PAN PDF or scanning an existing card, you need precise dimensions and high text contrast so that the Income Tax barcode, photo, and signature remain sharp when transferred to plastic. Here is how to crop and prepare your PAN card cleanly and securely.",
    keySpecs: [
      { label: "Card Standard", value: "CR80 / ISO/IEC 7810 ID-1" },
      { label: "Exact Measurements", value: "85.60 mm (W) × 53.98 mm (H) / 3.370 × 2.125 inches" },
      { label: "Aspect Ratio", value: "1.586 : 1" },
      { label: "e-PAN PDF Password", value: "Date of Birth as DDMMYYYY (e.g. 15081995)" },
      { label: "Color Space & DPI", value: "RGB, 300 DPI continuous tone" },
      { label: "Issuing Authorities", value: "Protean (NSDL e-Gov) & UTIITSL" },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Obtain Your e-PAN PDF or Scanned Card",
        description:
          "Download your official e-PAN PDF from NSDL or UTIITSL, or scan your physical PAN card on a flatbed scanner at 300 DPI. If using a smartphone, photograph the card flat on a dark background in even lighting.",
        tip: "Avoid flash glare directly over the laminated signature strip or hologram.",
      },
      {
        stepNumber: 2,
        title: "Load into PAN Card Crop Tool",
        description:
          "Open the Free PAN Card Crop Tool. Upload your file. If your e-PAN is encrypted, input your date of birth in DDMMYYYY format to unlock the vector PDF locally.",
        tip: "No special characters or slashes are needed in the password (e.g. use 05041992, not 05/04/1992).",
      },
      {
        stepNumber: 3,
        title: "Align Front & Back Frames",
        description:
          "Align the bounding box over the front of the PAN card. Ensure the applicant photograph, signature box, 10-digit alphanumeric PAN, father's name, and QR code fit snugly within the ISO ID-1 proportions.",
        tip: "Keep the aspect-ratio lock toggled on so the card cannot be accidentally stretched or distorted.",
      },
      {
        stepNumber: 4,
        title: "Deepen Signature & Export Print File",
        description:
          "Use the signature clarity filter to deepen faint black or blue ballpoint ink while keeping the card backdrop spotless. Export an A4 print layout ready for desktop inkjet printing or save high-res PNGs for specialized PVC card printers.",
        tip: "For Epson L805 or similar PVC tray printers, export individual PNG files sized at exactly 1011 × 638 pixels.",
      },
    ],
    commonMistakes: [
      {
        mistake: "Blurry or washed-out applicant signature",
        fix: "Smartphone photos often wash out handwritten signatures under ambient indoor light. Use the tool's signature sharpening control to boost dark ink contrast before exporting.",
      },
      {
        mistake: "Distorting card proportions to fit an arbitrary crop",
        fix: "Never stretch card width independently of height. Always keep the ISO ID-1 aspect ratio fixed so the card slides effortlessly into wallets and card readers.",
      },
      {
        mistake: "Printing with economy or draft ink settings",
        fix: "Government ID cards require maximum dot density. Always select 'Photo Quality' or 'Best' in your printer driver.",
      },
    ],
    faqs: [
      {
        question: "What is the password format for e-PAN PDFs?",
        answer:
          "Both NSDL and UTIITSL protect e-PAN documents using the applicant's Date of Birth formatted as DDMMYYYY. For example, if you were born on September 4, 1990, the password is 04091990.",
      },
      {
        question: "Can I print a PAN card on a standard home printer?",
        answer:
          "Yes. You can print our exported A4 layout on glossy photo paper, trim the borders with shears, and insert it into a standard ID card lamination pouch. The finished product has the exact size and stiffness of a bank card.",
      },
      {
        question: "Does the Income Tax QR code remain verifiable?",
        answer:
          "Yes. Our 300 DPI rendering preserves the microscopic 2D barcode modules so tax officers and banks can verify the digital signature using the official Income Tax QR Reader app.",
      },
      {
        question: "Are my PAN details uploaded to the server during processing?",
        answer:
          "No. All image decryption and canvas cropping run strictly inside your browser's private sandbox. No personal data or PAN numbers are ever uploaded or transmitted.",
      },
    ],
    relatedTool: {
      id: "pan-card-crop",
      name: "Free PAN Card Crop Tool",
      route: "/tools/pan-card-crop",
      description: "Extract and crop front and back sides of scanned PAN cards or e-PAN PDFs to standard CR80 size.",
      badge: "ISO ID-1",
    },
    relatedGuides: [
      "crop-aadhaar-card-pvc-printing",
      "straighten-crooked-document-photo",
    ],
  },

  {
    slug: "indian-passport-size-photo-guide",
    title: "How to Create Indian Passport Size Photos (35×45mm Online Guide)",
    seoTitle: "Indian Passport Size Photo Guide (35×45mm Specs & Rules) | Print Ready Designs",
    metaDescription:
      "Complete guide to official Indian passport size photo dimensions (35×45mm), 70–80% face coverage rules, background colors, and creating printable sheets online for free.",
    primaryKeyword: "how to create indian passport size photo 35x45mm",
    category: "Passport Photos",
    readTime: "6 min read",
    publishedAt: "2026-10-22",
    updatedAt: "2026-11-21",
    author: "Print Ready Designs Editorial Team",
    summary:
      "Master the official Ministry of External Affairs biometric specifications for Indian passport photos (35 × 45 mm), including 70–80% facial framing, solid backdrops, and Name & Date imprints.",
    introduction:
      "Passport applications in India are frequently rejected at Passport Seva Kendras (PSK) and Post Office Passport Seva Kendras (POPSK) due to non-compliant photographs. The Ministry of External Affairs (CPV Division) mandates exact biometric specifications: 35 mm × 45 mm outer dimensions, 70% to 80% face coverage, a plain light or white background, and neutral facial expressions. This guide explains how to produce compliant passport photos at home using your smartphone and our free online studio.",
    keySpecs: [
      { label: "Official Photo Dimensions", value: "35 mm wide × 45 mm high (3.5 × 4.5 cm / 1.38 × 1.77 in)" },
      { label: "Face Coverage Ratio", value: "70% to 80% (chin to crown must measure 31 mm to 36 mm)" },
      { label: "Background Requirement", value: "Uniform plain white or off-white; no patterns or shadows" },
      { label: "Eye Height Position", value: "Between 28 mm and 35 mm from bottom margin" },
      { label: "Head Position", value: "Centered, looking straight into lens with both ears visible" },
      { label: "Resolution", value: "300 DPI minimum for studio printout" },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Capture a Compliant Portrait at Home",
        description:
          "Stand about 1.5 to 2 meters away from the camera in front of a flat wall in bright, indirect daytime light. Keep your head straight, shoulders relaxed, mouth closed, and eyes open looking directly into the lens.",
        tip: "Wear dark-colored clothing (navy, black, charcoal) to provide strong contrast against the white backdrop.",
      },
      {
        stepNumber: 2,
        title: "Upload to Free Passport Photo Studio",
        description:
          "Open the Free Passport Photo Studio and upload your photograph. The on-screen biometric guide provides an overlay showing the exact 70–80% facial bounding limits.",
        tip: "Align your chin with the lower guide line and the crown of your head with the upper guide line.",
      },
      {
        stepNumber: 3,
        title: "Clean Background & Set Color",
        description:
          "If your background has wall shadows or uneven lighting, use our built-in in-browser AI Background Remover to isolate your silhouette and replace the backdrop with pure white or soft light blue.",
        tip: "Pure white is required for Indian passports, OCI cards, and Schengen visas. Light blue is standard for certain state exam portals.",
      },
      {
        stepNumber: 4,
        title: "Add Name & Date Imprint (If Required)",
        description:
          "For competitive recruitment examinations (such as SSC, UPSC, and State PSCs) that require applicant name and date of photo (DOPO) printed on the bottom margin, enable the footer imprint option and input your text.",
        tip: "Check your recruitment notification for exact date formatting rules (e.g. DD/MM/YYYY).",
      },
      {
        stepNumber: 5,
        title: "Download Single Photo or Print Sheet",
        description:
          "Download a single 35×45mm JPEG or WebP file for online form uploads, or tile multiple copies onto standard A4 or 4×6 photo paper with cutting guidelines.",
        tip: "Use the Free Multiple Photo Maker tool if you want custom counts such as 8 photos on 4×6 inch paper.",
      },
    ],
    commonMistakes: [
      {
        mistake: "Smiling broadly or showing teeth",
        fix: "Biometric passport scanners require a neutral expression. Keep your mouth gently closed and facial muscles relaxed.",
      },
      {
        mistake: "Flash glare and reflections on eyeglasses",
        fix: "Under current MEA rules, tinted glasses or lenses with flash glare cause instant rejection. If you wear glasses, angle your head slightly away from the light source or remove them for the photo.",
      },
      {
        mistake: "Wearing white or light cream shirts",
        fix: "Light clothing blends into the mandatory white background, making the applicant appear as a floating head. Always wear dark or colorful attire.",
      },
    ],
    faqs: [
      {
        question: "Can I take an Indian passport photo using my mobile phone?",
        answer:
          "Yes. Modern smartphone cameras capture more than enough resolution. Use the rear camera in good natural lighting, have someone else take the photo from eye level, and crop it using our biometric framing guide.",
      },
      {
        question: "Are selfies acceptable for passport applications?",
        answer:
          "No. Selfies are usually taken from a close distance (wide-angle distortion), skewing facial proportions and causing ear visibility issues. Have a family member or friend take the photo from 1.5–2 meters away.",
      },
      {
        question: "What is the difference between Indian passport and US visa photo sizes?",
        answer:
          "Indian passport photos measure 35 mm × 45 mm (rectangular). US Visa photos require a square format measuring 2 × 2 inches (51 mm × 51 mm / 50 × 50 mm). Both require a white background.",
      },
      {
        question: "How do I compress the photo under 50 KB for online government portals?",
        answer:
          "You can pass your cropped photo to our Free Advanced Photo Editor, set the target file size to 50 KB, and download an optimized JPEG that satisfies strict upload limits without visible blur.",
      },
    ],
    relatedTool: {
      id: "photo-studio",
      name: "Free Passport Photo Studio",
      route: "/tools/photo-studio",
      description: "Create compliant 35×45mm Indian passport photos with 70–80% face framing and print sheets.",
      badge: "Passport & Visa",
    },
    relatedGuides: [
      "print-multiple-passport-photos-a4",
      "crop-aadhaar-card-pvc-printing",
    ],
  },

  {
    slug: "print-multiple-passport-photos-a4",
    title: "How to Print Multiple Passport Photos on A4 & 4×6 Paper",
    seoTitle: "How to Print Multiple Passport Photos on A4 & 4×6 Paper | Print Ready Designs",
    metaDescription:
      "Learn how to arrange 4, 8, 16, or 32 passport photos on A4 or 4×6 photo paper with cutting guides. Save money with 1:1 scale studio-quality printing at home or photo labs.",
    primaryKeyword: "how to print multiple passport photos on a4 paper",
    category: "Passport Photos",
    readTime: "5 min read",
    publishedAt: "2026-10-25",
    updatedAt: "2026-11-21",
    author: "Print Ready Designs Editorial Team",
    summary:
      "Step-by-step instructions to tile identical passport copies on A4, 4×6, and 5×7 photo sheets with custom spacing, cutting guidelines, and 1:1 scale printer settings.",
    introduction:
      "Commercial photo studios frequently charge premium rates for a set of 8 passport photos, even though a standard 4×6 inch photo print costs only a few rupees at any digital lab or home printer. By tiling your own passport photos onto standard paper sheets with calibrated spacing and cutting guide marks, you can print high-volume batches at a fraction of the cost. Here is how to configure, tile, and print multiple passport photos on A4 and 4×6 inch paper.",
    keySpecs: [
      { label: "4×6 Inch Sheet Capacity", value: "6 to 8 photos (35 × 45 mm) comfortably with cutting margins" },
      { label: "A4 Sheet Capacity", value: "30 to 35 photos in an optimized 5×7 grid" },
      { label: "5×7 Inch Sheet Capacity", value: "12 to 15 photos" },
      { label: "Print Resolution", value: "300 DPI true physical scale" },
      { label: "Cutting Guides", value: "Thin hairline markers for scissors or guillotine cutters" },
      { label: "Printer Scaling", value: "Strictly 100% / Actual Size (never 'Fit to Page')" },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Prepare Your Cropped 35×45mm Photograph",
        description:
          "Ensure your source photograph is already cropped to standard 35×45mm proportions with an approved white or light backdrop. If you haven't cropped it yet, prepare it in our Free Passport Photo Studio first.",
        tip: "Save your source photo in high quality (PNG or high-res JPEG) so repeated tiling does not introduce artifacts.",
      },
      {
        stepNumber: 2,
        title: "Upload to Multiple Photo Maker",
        description:
          "Open the Free Multiple Photo Maker and upload your cropped photo. The grid generator instantly calculates layout geometry based on standard sheet dimensions.",
        tip: "Choose '4×6 inch' if you plan to print at a local photo studio or drugstore kiosk, or 'A4' if printing at home.",
      },
      {
        stepNumber: 3,
        title: "Configure Photo Count & Spacing",
        description:
          "Select the number of photo copies you require (e.g., 6 or 8 on a 4×6 sheet; 8, 16, or 32 on A4). Adjust horizontal and vertical gaps so you have comfortable breathing room for cutting.",
        tip: "Keep the gap between 2 mm and 3 mm to balance sheet economy and cutting precision.",
      },
      {
        stepNumber: 4,
        title: "Enable Cutting Guidelines",
        description:
          "Toggle on the cutting guide markers. These render faint crosshairs and alignment lines between adjacent photo cells, providing a foolproof visual reference for scissors or guillotine paper trimmers.",
        tip: "Cutting lines ensure that every trimmed photo measures exactly 35 mm by 45 mm.",
      },
      {
        stepNumber: 5,
        title: "Export Print-Ready PDF & Print at 100% Scale",
        description:
          "Download the 300 DPI PDF or PNG. In your computer's print dialog, select Photo Glossy Paper, High Quality, and explicitly choose 'Actual Size' or '100% Scale'.",
        tip: "If your print dialog shows 'Fit to Page' or 'Scale to Fit Media', turn it off immediately to avoid shrunken photos.",
      },
    ],
    commonMistakes: [
      {
        mistake: "Allowing printer driver to scale or shrink the sheet",
        fix: "Printer drivers frequently check 'Fit to Printable Area' by default. This shrinks the grid by 4–9%, rendering photos around 32×41 mm instead of 35×45 mm. Always force 100% scaling.",
      },
      {
        mistake: "Printing on standard plain copy paper",
        fix: "Standard 75–80 GSM copier paper absorbs ink unevenly, causing blurred edges and dull colors. Always use 180–240 GSM glossy or matte photographic paper.",
      },
      {
        mistake: "Placing photos right against the outer sheet edge",
        fix: "Most consumer inkjet printers cannot print right to the edge without borderless mode. Leave at least 5 mm of outer margin to prevent edge clipping.",
      },
    ],
    faqs: [
      {
        question: "How much money can I save printing sheets myself?",
        answer:
          "In India, a studio typically charges ₹80 to ₹150 for 8 passport photos. Printing a single 4×6 photo print at a digital lab costs only ₹5 to ₹10. By bringing your own pre-arranged 4×6 sheet, you save up to 90% on printing costs.",
      },
      {
        question: "Can I cut the photos with regular household scissors?",
        answer:
          "Yes. The cutting lines provide continuous straight guides. For even sharper professional edges, place the sheet on a cutting mat and trim along the lines using a metal ruler and rotary cutter.",
      },
      {
        question: "What is the best paper weight for passport photo sheets?",
        answer:
          "We recommend 200 GSM to 260 GSM resin-coated (RC) glossy or semi-gloss photo paper for bright skin tones and durability against passport glue or staples.",
      },
      {
        question: "Can I tile mixed photos of different family members on one sheet?",
        answer:
          "Our Multiple Photo Maker tiles identical copies. To combine photos of different family members onto one A4 sheet, use our Free Document Studio workspace.",
      },
    ],
    relatedTool: {
      id: "multiple-photo-maker",
      name: "Free Multiple Photo Maker",
      route: "/tools/multiple-photo-maker",
      description: "Arrange multiple passport copies on A4, 4×6, or 5×7 photo sheets with cutting guides.",
      badge: "Print Sheets",
    },
    relatedGuides: [
      "indian-passport-size-photo-guide",
      "crop-aadhaar-card-pvc-printing",
    ],
  },

  {
    slug: "straighten-crooked-document-photo",
    title: "How to Straighten a Crooked Document Photo Online",
    seoTitle: "How to Straighten a Crooked Document Photo Online | Print Ready Designs",
    metaDescription:
      "Learn how to fix perspective-distorted and tilted mobile photos of certificates, contracts, and ID cards. 4-corner homography unwarping, contrast enhancement, and PDF export.",
    primaryKeyword: "how to straighten a crooked document photo",
    category: "Document Processing",
    readTime: "5 min read",
    publishedAt: "2026-10-28",
    updatedAt: "2026-11-21",
    author: "Print Ready Designs Editorial Team",
    summary:
      "Step-by-step guide to correcting tilted, perspective-distorted smartphone photos of documents, certificates, and ID cards using interactive 4-corner unwarping and contrast filters.",
    introduction:
      "When you photograph a document, contract, or ID card with a smartphone camera, the paper is almost always captured from a slight angle. This perspective distortion makes the document appear trapezoidal or skewed, with uneven lighting, grey cast shadows, and tilted text lines that look unprofessional and are rejected by official portals. This guide explains how to use four-corner homography perspective correction to flatten, unskew, and brighten crooked document photos into clean rectangular scans.",
    keySpecs: [
      { label: "Correction Method", value: "Planar 4-Point Homography Transformation (3×3 Projective Matrix)" },
      { label: "Precision Tool", value: "Circular pixel-magnifying loupe for corner positioning" },
      { label: "Aspect Ratio Presets", value: "A4 Document (1:1.414), ID-1 Card (1:1.586), or Original Ratio" },
      { label: "Enhancement Pipeline", value: "Adaptive contrast, shadow reduction & text sharpening" },
      { label: "Export Formats", value: "Print-ready vector-wrapped PDF & High-Resolution PNG" },
      { label: "Privacy Protection", value: "Zero upload — WebAssembly/Canvas processing on device" },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Photograph Your Document in Good Light",
        description:
          "Place your paper or card on a contrasting flat surface (e.g. a dark table for white paper). Hold your phone directly above the paper as level as possible with all four corners visible in the frame.",
        tip: "Avoid casting your own body or phone shadow across the text by angling nearby lamps or standing sideways to a window.",
      },
      {
        stepNumber: 2,
        title: "Upload to Document Straightener",
        description:
          "Open the Free Document Straightener and upload your snapshot (JPEG, PNG, or WebP). The interactive canvas loads your photo with four movable corner pins positioned near the document perimeter.",
        tip: "Both single-sided documents and dual-sided identity cards are supported in independent tabs.",
      },
      {
        stepNumber: 3,
        title: "Pin the Four Paper Corners with the Loupe",
        description:
          "Click and drag each of the four corner pins to the physical vertex of the paper. As you drag, an on-screen circular magnifying loupe provides a zoomed-in preview of the pixels under your cursor for exact corner placement.",
        tip: "Place the pin exactly on the paper tip, ignoring any dark background or desk surface outside.",
      },
      {
        stepNumber: 4,
        title: "Select Output Aspect Ratio & Apply Enhancement",
        description:
          "Select standard A4 for certificates, letters, and marksheets, or select ID-1 for PAN and Aadhaar cards. Toggle the document enhancement filter to whiten dingy grey backgrounds and deepen faded print text.",
        tip: "The filter eliminates uneven smartphone shadows while keeping stamps, signatures, and logos colorful.",
      },
      {
        stepNumber: 5,
        title: "Download Rectified PDF or PNG",
        description:
          "Click Download to export your straightened document. The resulting file is a true flat rectangle with parallel margins and razor-sharp text ready for email submission or printing.",
        tip: "PDF export embeds the rectified image at native resolution for crisp multi-page printing.",
      },
    ],
    commonMistakes: [
      {
        mistake: "Placing corner pins on the edges of the table or bedsheet",
        fix: "The algorithm maps whatever quadrilateral you select into a perfect rectangle. If you include part of your desk, the desk will be stretched into the final document. Always pin the paper corners themselves.",
      },
      {
        mistake: "Attempting to photograph curled or bent paper",
        fix: "Homography assumes a flat plane. If paper has heavy folds or curls, gently smooth it with your hand or place a clean ruler near the edge before capturing the shot.",
      },
      {
        mistake: "Uploading sensitive legal documents to cloud servers",
        fix: "Many free scanner websites upload your documents to third-party servers. Print Ready Designs executes all perspective math in your browser memory, keeping your documents 100% private.",
      },
    ],
    faqs: [
      {
        question: "How does 4-corner perspective unwarping work mathematically?",
        answer:
          "In projective geometry, a photograph of a flat surface is related to the true rectangular surface by a 3×3 homography matrix with 8 degrees of freedom. By providing the coordinates of the 4 corners, our system solves the linear system and reverses the camera perspective distortion.",
      },
      {
        question: "Does unwarping reduce text clarity or blur signatures?",
        answer:
          "No. Our engine uses bilinear interpolation across high-resolution canvas buffers, preserving crisp letter edges, signature strokes, and official rubber stamps.",
      },
      {
        question: "Can I straighten WhatsApp document photos received from clients?",
        answer:
          "Yes. Clients frequently send tilted mobile snapshots over WhatsApp. You can upload those files directly, straighten them, enhance contrast, and export a clean PDF in less than 30 seconds.",
      },
      {
        question: "Can I straighten both sides of an ID card together?",
        answer:
          "Yes. Document Straightener features independent Front and Back workspace tabs so you can unwarp both sides and generate a combined print layout.",
      },
    ],
    relatedTool: {
      id: "document-straightener",
      name: "Free Document Straightener",
      route: "/tools/document-straightener",
      description: "Correct crooked, tilted, or perspective-distorted document photos into clean rectangular images.",
      badge: "Perspective Correction",
    },
    relatedGuides: [
      "crop-aadhaar-card-pvc-printing",
      "crop-pan-card-pvc-printing",
    ],
  },

  {
    slug: "create-ats-friendly-resume",
    title: "How to Create an ATS-Friendly Resume Online (Free Guide)",
    seoTitle: "How to Create an ATS-Friendly Resume Online (Free Guide) | Print Ready Designs",
    metaDescription:
      "Learn how to build an ATS-compliant resume that passes Applicant Tracking Systems. Essential sections, typography rules, formatting tips, and free vector PDF export.",
    primaryKeyword: "how to create an ats friendly resume online",
    category: "Career Tools",
    readTime: "6 min read",
    publishedAt: "2026-10-30",
    updatedAt: "2026-11-21",
    author: "Print Ready Designs Editorial Team",
    summary:
      "A complete guide to designing an ATS-compliant resume with structured job sections, standard typography, machine-readable vector PDF formatting, and zero sign-up friction.",
    introduction:
      "Over 90% of Fortune 500 companies and leading Indian recruitment platforms (including Naukri, LinkedIn, and corporate HR portals) use Applicant Tracking Systems (ATS) like Workday, Taleo, Greenhouse, and Lever to parse, filter, and score candidate resumes before a human recruiter ever sees them. Resumes created with complex multi-layered graphics, tables, text boxes, or exported as flat images fail parsing, resulting in automatic rejection. This guide teaches you how to structure an ATS-compliant resume that gets parsed cleanly and secures interviews.",
    keySpecs: [
      { label: "File Format", value: "Vector PDF with selectable machine-readable text (never flat image PDF)" },
      { label: "Layout Strategy", value: "Single-column or clean linear two-column without nested tables" },
      { label: "Font Recommendations", value: "Standard system fonts (Arial, Calibri, Helvetica, Roboto, Inter, Georgia)" },
      { label: "Heading Hierarchy", value: "Standard H2/H3 titles (Summary, Experience, Education, Skills, Projects)" },
      { label: "File Size Target", value: "Under 1 MB for instantaneous portal uploads" },
      { label: "Data Privacy", value: "Client-side browser storage; zero server retention of personal resume data" },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Start with Clean Contact Information",
        description:
          "Place your full name as the main title, followed by professional email, phone number, location (City, State/Country), and a clean link to your LinkedIn profile or portfolio.",
        tip: "Avoid putting contact info inside header or footer margins, as some legacy ATS parsers ignore header/footer zones.",
      },
      {
        stepNumber: 2,
        title: "Craft a Keyword-Rich Professional Summary",
        description:
          "Write a 2 to 4 sentence elevator pitch highlighting your title, core competencies, years of experience, and top accomplishments tailored to your target job profile.",
        tip: "Integrate keywords directly from the target job description (e.g. 'Full-Stack Development', 'React', 'TypeScript', 'Project Management').",
      },
      {
        stepNumber: 3,
        title: "Format Work Experience in Reverse Chronological Order",
        description:
          "List your jobs starting with the most recent. Include Job Title, Company Name, Location, and Employment Dates (Month Year – Month Year). Use bullet points starting with strong action verbs (e.g. 'Spearheaded', 'Optimized', 'Automated').",
        tip: "Quantify achievements with metrics wherever possible (e.g. 'Reduced page load times by 40%', 'Managed budget of ₹15 Lakhs').",
      },
      {
        stepNumber: 4,
        title: "Structure Education, Skills, and Projects",
        description:
          "Add your highest degrees, graduating institution, and graduation year. Group your skills into logical buckets (e.g., Programming Languages, Frameworks, Tools, Soft Skills). List 2–3 key projects with brief descriptions and technologies used.",
        tip: "Avoid visual rating bars (e.g. 4/5 stars for Python); ATS systems cannot interpret visual rating icons.",
      },
      {
        stepNumber: 5,
        title: "Preview & Download True Vector PDF",
        description:
          "Use the Free Resume / CV Maker to preview your layout in real time. Choose an ATS-optimized clean template and export your resume as a pure vector PDF rendered locally via pdf-lib.",
        tip: "Test your downloaded PDF by opening it and copying text with Ctrl+A and Ctrl+C. If you can paste the text into Notepad cleanly, ATS parsers will read it flawlessly.",
      },
    ],
    commonMistakes: [
      {
        mistake: "Exporting resumes from graphic design tools as flat images",
        fix: "Many candidates design resumes in image-based tools and export as PDF where text is converted to flat bitmap pixels. An ATS parser sees this as a blank page. Always export true vector text.",
      },
      {
        mistake: "Using complex tables or floating text boxes",
        fix: "When an ATS parses tables, it often reads across cells horizontally, blending job titles with dates and companies into unreadable gibberish. Use linear semantic layouts.",
      },
      {
        mistake: "Using non-standard section headers",
        fix: "Avoid creative section titles like 'Where I Have Been' or 'Superpowers'. Stick to standard titles like 'Professional Experience', 'Education', 'Skills', and 'Projects'.",
      },
    ],
    faqs: [
      {
        question: "What makes a resume truly ATS-compliant?",
        answer:
          "An ATS-compliant resume uses selectable vector text, simple linear formatting, standard headings, clear chronological dates, and relevant keywords that match the job description, allowing automated parsers to index every field accurately.",
      },
      {
        question: "Should I include a photograph on my resume?",
        answer:
          "In the United States, UK, and Canada, photographs are strongly discouraged to prevent hiring bias. In India and parts of Europe, photographs are acceptable for customer-facing or corporate roles. Our Resume Maker lets you toggle photos on or off with a single click.",
      },
      {
        question: "Is single-column always better than two-column?",
        answer:
          "Modern ATS parsers handle clean two-column layouts well as long as sections are separated into distinct structural columns without overlapping layers. Single-column layouts offer maximum backwards compatibility with older corporate systems.",
      },
      {
        question: "Do I have to pay or sign up to download my PDF?",
        answer:
          "No. Print Ready Designs requires no account creation, no email address, and no subscription fees. Your resume data is saved in your browser's private localStorage and you can download unlimited vector PDFs free of charge.",
      },
    ],
    relatedTool: {
      id: "resume-maker",
      name: "Free Resume / CV Maker",
      route: "/tools/resume-maker",
      description: "Build clean, ATS-optimized resumes with live preview and instant client-side vector PDF generation.",
      badge: "ATS Ready",
    },
    relatedGuides: [
      "indian-passport-size-photo-guide",
      "straighten-crooked-document-photo",
    ],
  },
];

/**
 * Retrieve a guide by its unique URL slug.
 */
export function getGuideBySlug(slug: string): GuideItem | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/**
 * Retrieve all guides belonging to a specific category.
 */
export function getGuidesByCategory(category: GuideItem["category"]): GuideItem[] {
  return GUIDES.filter((g) => g.category === category);
}

/**
 * Retrieve all unique guide categories.
 */
export function getAllGuideCategories(): GuideItem["category"][] {
  const categories = new Set(GUIDES.map((g) => g.category));
  return Array.from(categories);
}
