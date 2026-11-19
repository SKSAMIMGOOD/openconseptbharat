import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Passport Photo Studio",
  description:
    "Create official Indian passport photos (35x45 mm), visa portraits, and stamp-size prints online for free. Custom backdrops, fine print calibration, and 300 DPI export.",
  keywords: [
    "free passport photo studio",
    "indian passport photo online",
    "visa photo maker",
    "35x45 mm photo maker",
    "passport photo print sheet",
    "free biometric photo maker",
  ],
  alternates: {
    canonical: "/tools/photo-studio",
  },
  openGraph: {
    title: "Free Passport Photo Studio | Browser Utility Studio",
    description:
      "Create official Indian passport photos (35x45 mm), visa portraits, and stamp-size prints online for free with 300 DPI export.",
    url: "/tools/photo-studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Passport Photo Studio | Browser Utility Studio",
    description:
      "Create official Indian passport photos (35x45 mm), visa portraits, and stamp-size prints online for free with 300 DPI export.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
