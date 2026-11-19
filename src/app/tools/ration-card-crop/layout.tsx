import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Ration Card Crop Tool",
  description:
    "Free online tool to crop and standardize digital Ration Card documents and slips. High-contrast enhancement and side-by-side folding card print layout.",
  keywords: [
    "free ration card crop tool",
    "ration card crop online",
    "digital ration card print",
    "e ration slip cropper",
    "ration card pdf crop",
  ],
  alternates: {
    canonical: "/tools/ration-card-crop",
  },
  openGraph: {
    title: "Free Ration Card Crop Tool | Browser Utility Studio",
    description:
      "Crop and enhance digital Ration Cards and slips for clean laminated printing. Zero server uploads.",
    url: "/tools/ration-card-crop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Ration Card Crop Tool | Browser Utility Studio",
    description:
      "Crop and enhance digital Ration Cards and slips for clean laminated printing. Zero server uploads.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
