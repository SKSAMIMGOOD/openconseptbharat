import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of use for Browser Utility Studio free client-side document and image processing utilities.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Use | Browser Utility Studio",
    description:
      "Terms of use for Browser Utility Studio free client-side document and image processing utilities.",
    url: "/terms",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
