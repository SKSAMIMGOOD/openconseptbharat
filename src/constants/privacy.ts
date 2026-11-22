export interface PrivacyGuarantee {
  title: string;
  description: string;
  technicalMechanism: string;
}

export interface ToolPrivacySpec {
  id: string;
  toolName: string;
  executionEnvironment: string;
  networkTransmission: string;
  dataPersistence: string;
  supportedFormats: string;
  maxFileSize: string;
  lifecycle: string;
}

export interface ThirdPartyDisclosure {
  service: string;
  purpose: string;
  dataTransmitted: string;
  optionalOrRequired: string;
}

export const PRIVACY_GUARANTEES: PrivacyGuarantee[] = [
  {
    title: "Zero Document Uploads to Remote Servers",
    description:
      "Your documents, identity scans, and portrait photos never leave your device. All calculations, cropping, image manipulation, and PDF synthesis occur exclusively inside your web browser.",
    technicalMechanism:
      "No backend upload endpoints exist. Files are handled using standard HTML5 File, Blob, and Canvas APIs strictly within local JavaScript heap memory.",
  },
  {
    title: "No Cloud Storage, Databases, or Server Retention",
    description:
      "There are no remote databases, object storage buckets (e.g., Amazon S3, Google Cloud Storage), or server caches attached to this platform.",
    technicalMechanism:
      "The application runs as a static client-side bundle with zero database drivers, zero remote persistence APIs, and zero file-receiving servers.",
  },
  {
    title: "Ephemeral Document Memory Management",
    description:
      "Identity documents and photos exist only in temporary browser memory. When you reload the page, clear the workspace, or close the tab, all image buffers are immediately reclaimed.",
    technicalMechanism:
      "Object URLs (blob:...) are revoked explicitly via URL.revokeObjectURL(), and references are wiped to allow the browser garbage collector to reclaim heap memory immediately.",
  },
  {
    title: "Zero Behavioral Trackers, Pixels, or Profiling",
    description:
      "We do not run Google Analytics, Meta Pixel, tracking beacons, advertising cookies, or behavioral surveillance scripts. Your use of the studio is private.",
    technicalMechanism:
      "No tracking SDKs, marketing tags, or third-party telemetry scripts are embedded in HTML, layout headers, or application components.",
  },
  {
    title: "Client-Side WebAssembly & On-Device AI",
    description:
      "Smart background removal and vector document detection run locally on your device hardware (CPU/GPU) using WebAssembly and Web Workers.",
    technicalMechanism:
      "Background removal models (ONNX Runtime Web) download static model weights over HTTPS and perform neural inference locally in a dedicated Web Worker. Your images are never sent to external AI servers.",
  },
  {
    title: "Transparent Local Storage Usage",
    description:
      "We strictly isolate application preferences (theme, default DPI) from document data. Only the Resume Maker optionally stores draft form fields locally so you do not lose your progress.",
    technicalMechanism:
      "LocalStorage is used strictly for user preferences (theme, default DPI, unit preferences) and Resume Maker draft text fields. Identity cards and image blobs are never saved to LocalStorage or IndexedDB.",
  },
];

export const TOOL_PRIVACY_MATRIX: ToolPrivacySpec[] = [
  {
    id: "aadhaar-card-crop",
    toolName: "e-Aadhaar Card Crop Tool",
    executionEnvironment: "Browser Canvas + PDF.js WebAssembly",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Ephemeral RAM only — no storage",
    supportedFormats: "PDF, JPG, PNG, WebP",
    maxFileSize: "40 MB (PDF) / 25 MB (Images)",
    lifecycle: "Completely cleared on tab close or page reload",
  },
  {
    id: "pan-card-crop",
    toolName: "PAN Card Crop Tool",
    executionEnvironment: "Browser Canvas + CR80 Normalizer",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Ephemeral RAM only — no storage",
    supportedFormats: "PDF, JPG, PNG, WebP",
    maxFileSize: "40 MB (PDF) / 25 MB (Images)",
    lifecycle: "Completely cleared on tab close or page reload",
  },
  {
    id: "ration-card-crop",
    toolName: "Ration Card Crop Tool",
    executionEnvironment: "Browser Canvas + CR80 Normalizer",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Ephemeral RAM only — no storage",
    supportedFormats: "PDF, JPG, PNG, WebP",
    maxFileSize: "40 MB (PDF) / 25 MB (Images)",
    lifecycle: "Completely cleared on tab close or page reload",
  },
  {
    id: "document-studio",
    toolName: "Document Studio (Voter ID & Custom Cards)",
    executionEnvironment: "Browser Canvas + pdf-lib Vector Engine",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Ephemeral RAM only — no storage",
    supportedFormats: "PDF, JPG, PNG, WebP",
    maxFileSize: "40 MB (PDF) / 25 MB (Images)",
    lifecycle: "Completely cleared on tab close or page reload",
  },
  {
    id: "photo-studio",
    toolName: "Passport Photo Studio",
    executionEnvironment: "Browser Canvas + JFIF DPI Metadata Engine",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Ephemeral RAM only — no storage",
    supportedFormats: "JPG, JPEG, PNG, WebP",
    maxFileSize: "20 MB",
    lifecycle: "Completely cleared on tab close or page reload",
  },
  {
    id: "multiple-photo-maker",
    toolName: "Multiple Photo Maker",
    executionEnvironment: "Browser Canvas + Multi-Threaded Grid Engine",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Ephemeral RAM only — no storage",
    supportedFormats: "JPG, JPEG, PNG, WebP",
    maxFileSize: "20 MB per photo",
    lifecycle: "Completely cleared on tab close or page reload",
  },
  {
    id: "document-straightener",
    toolName: "Document Straightener",
    executionEnvironment: "Browser 4-Point Homography Matrix Engine",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Ephemeral RAM only — no storage",
    supportedFormats: "JPG, JPEG, PNG, WebP",
    maxFileSize: "25 MB",
    lifecycle: "Completely cleared on tab close or page reload",
  },
  {
    id: "photo-editor",
    toolName: "Advanced Photo Editor",
    executionEnvironment: "Browser 2D Context Canvas Filters",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Ephemeral RAM only — no storage",
    supportedFormats: "JPG, JPEG, PNG, WebP",
    maxFileSize: "25 MB",
    lifecycle: "Completely cleared on tab close or page reload",
  },
  {
    id: "background-remover",
    toolName: "Background Remover",
    executionEnvironment: "ONNX Runtime WebAssembly in Web Worker",
    networkTransmission: "0 image bytes uploaded (Model weights fetched from Hugging Face CDN)",
    dataPersistence: "Model weights cached in browser CacheStorage; image strictly in RAM",
    supportedFormats: "JPG, JPEG, PNG, WebP",
    maxFileSize: "25 MB",
    lifecycle: "Image cleared on tab close; model cached locally for fast repeat use",
  },
  {
    id: "resume-maker",
    toolName: "Resume / CV Maker",
    executionEnvironment: "Browser React Form + pdf-lib Vector Generator",
    networkTransmission: "0 bytes uploaded (100% on-device)",
    dataPersistence: "Draft text fields saved to browser LocalStorage for draft preservation",
    supportedFormats: "Form input / JSON export",
    maxFileSize: "Client device memory limit",
    lifecycle: "Draft text persists locally until cleared via 'Reset / Clear All'",
  },
];

export const THIRD_PARTY_DISCLOSURES: ThirdPartyDisclosure[] = [
  {
    service: "Google Fonts (fonts.googleapis.com / fonts.gstatic.com)",
    purpose: "Typography display (Inter, Plus Jakarta Sans, Fira Code)",
    dataTransmitted: "Standard browser HTTP GET for stylesheet and font binary files (IP address only, no personal or file data)",
    optionalOrRequired: "Required for interface rendering",
  },
  {
    service: "Hugging Face (huggingface.co)",
    purpose: "Pretrained AI segmentation model weights for Background Remover",
    dataTransmitted: "Standard HTTPS GET for static .onnx weight files; zero images or user data sent",
    optionalOrRequired: "Loaded only when accessing Background Remover tool",
  },
];
