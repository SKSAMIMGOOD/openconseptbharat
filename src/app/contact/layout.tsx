import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support",
  description:
    "Contact Print Ready Designs for feedback, technical support, feature suggestions, or security disclosures.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact & Support | Print Ready Designs",
    description:
      "Get in touch with the Print Ready Designs team for technical support, feedback, or inquiries.",
    url: "/contact",
    siteName: "Print Ready Designs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact & Support | Print Ready Designs",
    description:
      "Get in touch with the Print Ready Designs team for technical support, feedback, or inquiries.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
