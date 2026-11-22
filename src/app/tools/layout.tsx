import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Free Online Utilities",
  description:
    "Browse our complete catalog of 100% free browser-based utilities for photo editing, passport photo creation, background removal, ID card cropping, and ATS resumes.",
  keywords: [
    "all free online utilities",
    "print ready designs tools",
    "free online tools catalog",
    "photo and document utilities",
    "aadhaar pan card cropper",
    "passport photo studio online",
  ],
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "All Free Online Utilities | Print Ready Designs",
    description:
      "Explore all free browser tools for photo editing, passport photos, ID card cropping, and resumes. Zero server uploads.",
    url: "/tools",
    siteName: "Print Ready Designs",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Free Online Utilities | Print Ready Designs",
    description:
      "Explore all free browser tools for photo editing, passport photos, ID card cropping, and resumes. Zero server uploads.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
