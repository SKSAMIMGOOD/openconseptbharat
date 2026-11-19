import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preferences & Settings",
  description:
    "Manage your local browser preferences, theme, and default export calibration for Browser Utility Studio.",
  alternates: {
    canonical: "/settings",
  },
  openGraph: {
    title: "Preferences & Settings | Browser Utility Studio",
    description:
      "Manage local client-side preferences and defaults for Browser Utility Studio.",
    url: "/settings",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
