export interface PrivacyGuarantee {
  title: string;
  description: string;
  technicalMechanism: string;
}

export const PRIVACY_GUARANTEES: PrivacyGuarantee[] = [
  {
    title: "Zero Server Uploads",
    description: "Your documents, identity scans, and photos never leave your device. All calculations, crops, and renders occur inside your browser memory.",
    technicalMechanism: "No backend upload endpoints exist. Files are handled using standard HTML5 File & Blob APIs strictly within client heap.",
  },
  {
    title: "No Cloud Storage or Databases",
    description: "There are no databases, external Amazon S3 / Google Cloud buckets, or remote storage systems attached to this platform.",
    technicalMechanism: "The application contains no database drivers, no remote persistence services, and zero persistence APIs.",
  },
  {
    title: "No Local Storage of Sensitive Documents",
    description: "We do not cache your sensitive personal identification files in browser localStorage, SessionStorage, or IndexedDB.",
    technicalMechanism: "Document blobs exist only in ephemeral JavaScript variables and are immediately released when the tab closes or files are cleared.",
  },
  {
    title: "Zero Analytics or Tracking Pixels",
    description: "No Google Analytics, Meta Pixel, or behavioral spyware runs on this utility platform. Your usage is completely confidential.",
    technicalMechanism: "No third-party SDKs, tracking tags, or remote telemetry beacons are embedded in HTML or scripts.",
  },
  {
    title: "Client-Side AI & WebAssembly",
    description: "Any smart background removal or face orientation utilities execute through compiled WebAssembly and WebGL/WebGPU in your browser.",
    technicalMechanism: "Local models are loaded as static weights into the client execution sandbox, requiring zero remote API calls for inference.",
  },
];
