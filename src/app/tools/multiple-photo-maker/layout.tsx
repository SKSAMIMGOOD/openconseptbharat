import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Multiple Photo Maker",
  description:
    "Arrange multiple passport photos on standard A4, 4x6, and 5x7 inch print sheets online for free. Instant 1:1 scale print export with cutting guides.",
  keywords: [
    "free multiple photo maker",
    "passport photo sheet maker",
    "print passport photos on a4",
    "4x6 photo sheet",
    "tile photos online free",
  ],
  alternates: {
    canonical: "/tools/multiple-photo-maker",
  },
  openGraph: {
    title: "Free Multiple Photo Maker | Browser Utility Studio",
    description:
      "Tile and print multiple passport photo copies on A4 and 4x6 photo paper with custom gaps and cutting marks.",
    url: "/tools/multiple-photo-maker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Multiple Photo Maker | Browser Utility Studio",
    description:
      "Tile and print multiple passport photo copies on A4 and 4x6 photo paper with custom gaps and cutting marks.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
