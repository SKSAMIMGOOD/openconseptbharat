import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of use for Print Ready Designs free client-side document cropping, passport photo, and PDF processing utilities.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Use | Print Ready Designs",
    description:
      "Terms of use for Print Ready Designs free client-side document cropping, passport photo, and PDF processing utilities.",
    url: "/terms",
    siteName: "Print Ready Designs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Use | Print Ready Designs",
    description:
      "Terms of use for Print Ready Designs free client-side document cropping, passport photo, and PDF processing utilities.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
