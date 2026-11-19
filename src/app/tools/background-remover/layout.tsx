import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Background Remover",
  description:
    "Remove image backgrounds 100% free with local on-device AI neural networks. Clean edge detection, transparent or custom backdrops, zero server uploads.",
  keywords: [
    "free background remover",
    "ai background remover",
    "remove background online free",
    "in-browser background removal",
    "transparent png maker",
  ],
  alternates: {
    canonical: "/tools/background-remover",
  },
  openGraph: {
    title: "Free Background Remover | Browser Utility Studio",
    description:
      "Remove image backgrounds 100% free using in-browser AI. Transparent or custom backdrops with zero server uploads.",
    url: "/tools/background-remover",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Background Remover | Browser Utility Studio",
    description:
      "Remove image backgrounds 100% free using in-browser AI. Transparent or custom backdrops with zero server uploads.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
