import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Multiple Photo Maker",
  description:
    "Arrange multiple passport photos on standard A4, 4x6, and 5x7 inch print sheets online for free.",
  alternates: {
    canonical: "/tools/multiple-photo-maker",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
