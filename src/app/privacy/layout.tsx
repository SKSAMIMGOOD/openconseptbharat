import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Guarantee & Zero-Upload Verification",
  description:
    "Read our strict zero-upload privacy policy and step-by-step instructions for independently verifying in your browser DevTools that zero bytes leave your device.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Guarantee & Verification | Print Ready Designs",
    description:
      "Strict zero-upload privacy architecture. Verify client-side data isolation directly in your browser network tab.",
    url: "/privacy",
    siteName: "Print Ready Designs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Guarantee & Verification | Print Ready Designs",
    description:
      "Strict zero-upload privacy architecture. Verify client-side data isolation directly in your browser network tab.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
