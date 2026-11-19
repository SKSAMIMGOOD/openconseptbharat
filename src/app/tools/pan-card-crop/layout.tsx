import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free PAN Card Crop Tool",
  description:
    "Free online tool to extract and crop front and back sides of scanned PAN cards or e-PAN PDFs to standard ISO ID-1 wallet card size (85.6 x 53.98 mm).",
  keywords: [
    "free pan card crop tool",
    "pan card crop online",
    "e pan card crop pdf",
    "pan card print size",
    "iso id-1 card cropper",
  ],
  alternates: {
    canonical: "/tools/pan-card-crop",
  },
  openGraph: {
    title: "Free PAN Card Crop Tool | Browser Utility Studio",
    description:
      "Crop scanned PAN cards or e-PAN PDFs to exact ISO ID-1 wallet size ready for PVC printout. 100% in-browser privacy.",
    url: "/tools/pan-card-crop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free PAN Card Crop Tool | Browser Utility Studio",
    description:
      "Crop scanned PAN cards or e-PAN PDFs to exact ISO ID-1 wallet size ready for PVC printout. 100% in-browser privacy.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
