import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Resume / CV Maker",
  description:
    "Build clean, modern, ATS-friendly resumes online for free. Real-time preview, ATS-optimized templates, and instant client-side vector PDF generation.",
  keywords: [
    "free resume cv maker",
    "ats resume maker free",
    "free cv builder",
    "vector pdf resume",
    "privacy first resume builder",
  ],
  alternates: {
    canonical: "/tools/resume-maker",
  },
  openGraph: {
    title: "Free Resume / CV Maker | Browser Utility Studio",
    description:
      "Design professional, job-ready resumes with real-time preview and direct vector PDF export. Personal data never leaves your browser.",
    url: "/tools/resume-maker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Resume / CV Maker | Browser Utility Studio",
    description:
      "Design professional, job-ready resumes with real-time preview and direct vector PDF export. Personal data never leaves your browser.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
