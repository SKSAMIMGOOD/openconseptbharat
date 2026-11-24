import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raw Image to Clean PDF — Straighten & Compile Multi-Page Documents",
  description:
    "Convert multiple photos of paper documents, receipts, and notes into clean, perspective-corrected A4 PDFs. 100% in-browser processing with zero server uploads.",
  keywords: [
    "raw image to pdf",
    "document photo to clean pdf",
    "multi-page pdf maker",
    "camera photo to document pdf",
    "scan photo to pdf in browser",
  ],
};

export default function RawImageToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
