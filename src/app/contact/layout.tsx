import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support",
  description:
    "Contact Browser Utility Studio for feedback, support, feature suggestions, or security disclosures.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact & Support | Browser Utility Studio",
    description:
      "Get in touch with the Browser Utility Studio team for technical support, feedback, or inquiries.",
    url: "/contact",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
