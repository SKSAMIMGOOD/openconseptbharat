import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Print Ready Designs, our zero-upload privacy architecture, and our mission to provide free client-side document cropping and photo printing tools.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | Print Ready Designs",
    description:
      "Learn about Print Ready Designs, our zero-upload privacy architecture, and our mission to provide free client-side document cropping and photo printing tools.",
    url: "/about",
    siteName: "Print Ready Designs",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Print Ready Designs",
    description:
      "Learn about Print Ready Designs, our zero-upload privacy architecture, and our mission to provide free client-side document cropping and photo printing tools.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
