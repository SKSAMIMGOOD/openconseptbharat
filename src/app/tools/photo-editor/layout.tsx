import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Advanced Photo Editor",
  description:
    "Free online photo editor for cropping, rotating, tone adjustments, and compressing pictures to exact file size limits directly in browser memory.",
  keywords: [
    "free advanced photo editor",
    "online photo editor free",
    "compress photo to kb",
    "crop photo online",
    "photo tone adjustment",
  ],
  alternates: {
    canonical: "/tools/photo-editor",
  },
  openGraph: {
    title: "Free Advanced Photo Editor | Browser Utility Studio",
    description:
      "Crop, rotate, enhance, and compress photos in browser memory. Non-destructive adjustments with zero server uploads.",
    url: "/tools/photo-editor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Advanced Photo Editor | Browser Utility Studio",
    description:
      "Crop, rotate, enhance, and compress photos in browser memory. Non-destructive adjustments with zero server uploads.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
