import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Aadhaar Card Crop Tool",
  description:
    "Free online tool to crop e-Aadhaar PDF letters into standard wallet card size. Local password unlock, sharpening filter, and direct 300 DPI A4 print layout.",
  keywords: [
    "free aadhaar card crop tool",
    "eaadhaar crop online",
    "aadhaar card crop to wallet size",
    "aadhaar pdf crop free",
    "aadhaar print maker",
  ],
  alternates: {
    canonical: "/tools/aadhaar-card-crop",
  },
  openGraph: {
    title: "Free Aadhaar Card Crop Tool | Browser Utility Studio",
    description:
      "Process password-protected e-Aadhaar PDFs locally. Standard front/back wallet card cropping with zero server uploads.",
    url: "/tools/aadhaar-card-crop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Aadhaar Card Crop Tool | Browser Utility Studio",
    description:
      "Process password-protected e-Aadhaar PDFs locally. Standard front/back wallet card cropping with zero server uploads.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
