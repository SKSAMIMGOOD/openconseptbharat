import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Document Studio",
  description:
    "Free browser-based document workspace for cropping and printing Aadhaar, PAN, Voter ID, and Ration cards with dual-side canvas processing.",
  keywords: [
    "free document studio",
    "government id card cropping",
    "id card print studio",
    "voter id crop",
    "aadhaar pan crop workspace",
  ],
  alternates: {
    canonical: "/tools/document-studio",
  },
  openGraph: {
    title: "Free Document Studio | Browser Utility Studio",
    description:
      "Client-side document workspace for Aadhaar, PAN, Voter ID, and Ration cards. Dual-side cropping and direct A4 print layout.",
    url: "/tools/document-studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Document Studio | Browser Utility Studio",
    description:
      "Client-side document workspace for Aadhaar, PAN, Voter ID, and Ration cards. Dual-side cropping and direct A4 print layout.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
