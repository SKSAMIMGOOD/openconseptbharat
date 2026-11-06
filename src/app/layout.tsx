import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreferencesProvider } from "@/context/PreferencesContext";
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

// Inline script to prevent theme flash before React hydration
const themeInitScript = `
  (function() {
    try {
      var raw = localStorage.getItem('bus_user_preferences');
      var theme = 'system';
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && (parsed.theme === 'dark' || parsed.theme === 'light' || parsed.theme === 'system')) {
          theme = parsed.theme;
        }
      }
      var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="flex flex-col min-h-screen font-sans antialiased text-surface-900 bg-surface-50 dark:bg-surface-950 dark:text-surface-100 selection:bg-brand-100 selection:text-brand-900 transition-colors duration-150">
        <PreferencesProvider>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </PreferencesProvider>
      </body>
    </html>
  );
}
