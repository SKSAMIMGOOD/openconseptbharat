import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preferences & Settings",
  description:
    "Manage your local browser preferences, theme, and default export calibration for Print Ready Designs.",
  alternates: {
    canonical: "/settings",
  },
  openGraph: {
    title: "Preferences & Settings | Print Ready Designs",
    description:
      "Manage local client-side preferences and defaults for Print Ready Designs.",
    url: "/settings",
    siteName: "Print Ready Designs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Preferences & Settings | Print Ready Designs",
    description:
      "Manage local client-side preferences and defaults for Print Ready Designs.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
