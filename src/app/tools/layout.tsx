import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Free Online Utilities",
  description:
    "Browse our complete catalog of 100% free browser-based utilities for photo editing, passport photo creation, background removal, ID card cropping, and ATS resumes.",
  keywords: [
    "all free online utilities",
    "browser utility studio tools",
    "free online tools catalog",
    "photo and document utilities",
  ],
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "All Free Online Utilities | Browser Utility Studio",
    description:
      "Explore all free browser tools for photo editing, passport photos, ID card cropping, and resumes. Zero server uploads.",
    url: "/tools",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Free Online Utilities | Browser Utility Studio",
    description:
      "Explore all free browser tools for photo editing, passport photos, ID card cropping, and resumes. Zero server uploads.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
