import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Browser Utility Studio, our zero-upload privacy architecture, and our mission to provide free client-side document and photo tools.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | Browser Utility Studio",
    description:
      "Learn about Browser Utility Studio, our zero-upload privacy architecture, and our mission to provide free client-side document and photo tools.",
    url: "/about",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
