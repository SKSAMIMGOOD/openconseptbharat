import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Browser Utility Studio | Privacy-First Document & Photo Tools",
  description:
    "100% browser-based utility platform for PAN card crop, Aadhaar card crop, passport photo studio, and client-side PDF generation. Zero server uploads.",
  keywords: [
    "browser utility",
    "pan card crop",
    "aadhaar card crop",
    "passport photo maker",
    "client-side pdf",
    "privacy-first photo editor",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="flex flex-col min-h-screen font-sans antialiased text-surface-900 bg-surface-50 selection:bg-brand-100 selection:text-brand-900">
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
