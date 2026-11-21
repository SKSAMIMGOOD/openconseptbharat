import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Straightener – Perspective Correction",
  description:
    "Free client-side document straightener. Convert crooked, tilted, and perspective-distorted document photographs into clean rectangular images with precision corner adjustment.",
  keywords: [
    "document straightener",
    "perspective correction",
    "4 corner crop",
    "unskew document",
    "straighten photo",
    "whatsapp document scanner",
    "aadhaar pan card perspective crop",
  ],
  alternates: {
    canonical: "/tools/document-straightener",
  },
  openGraph: {
    title: "Document Straightener – Perspective Correction | Browser Utility Studio",
    description:
      "Convert crooked or tilted smartphone photos into straight, rectangular documents with precision four-corner perspective homography.",
    url: "/tools/document-straightener",
  },
  twitter: {
    card: "summary_large_image",
    title: "Document Straightener – Perspective Correction | Browser Utility Studio",
    description:
      "Convert crooked or tilted smartphone photos into straight, rectangular documents with precision four-corner perspective homography.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
