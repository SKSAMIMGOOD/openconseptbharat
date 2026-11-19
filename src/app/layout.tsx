import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { WelcomeSupportPopup } from "@/components/support";
import { getWebsiteStructuredData, SITE_URL } from "@/lib/seo/structured-data";
import "@/app/globals.css";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Browser Utility Studio | Free Online Tools to Edit, Crop & Print",
    template: "%s | Browser Utility Studio",
  },
  description:
    "100% free online tools for photo editing, passport photo creation, background remover, government ID card cropping, and ATS resume making. Completely private in-browser processing with zero server uploads.",
  applicationName: "Browser Utility Studio",
  authors: [{ name: "Browser Utility Studio" }],
  keywords: [
    "free online tools",
    "photo editing",
    "passport photo",
    "free passport photo studio",
    "government id card cropping",
    "free pan card crop tool",
    "free aadhaar card crop tool",
    "free ration card crop tool",
    "resume maker",
    "free resume cv maker",
    "background remover",
    "free background remover",
    "multiple photo maker",
    "in-browser photo editor",
    "client-side pdf",
    "zero-upload privacy",
    "all free online utilities",
  ],
  creator: "Browser Utility Studio",
  publisher: "Browser Utility Studio",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Browser Utility Studio",
    title: "Browser Utility Studio | Free Online Tools to Edit, Crop & Print",
    description:
      "100% free online tools for photo editing, passport photos, background remover, government ID card cropping, and ATS resumes. Completely private, client-side execution with zero server uploads.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Browser Utility Studio - Free Online Tools to Edit, Crop & Print",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browser Utility Studio | Free Online Tools to Edit, Crop & Print",
    description:
      "100% free online tools for photo editing, passport photos, ID card cropping, and ATS resumes. Zero server uploads.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebsiteStructuredData()),
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen font-sans antialiased text-surface-900 bg-surface-50 dark:bg-surface-950 dark:text-surface-100 selection:bg-brand-100 selection:text-brand-900 transition-colors duration-150">
        <PreferencesProvider>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <WelcomeSupportPopup />
        </PreferencesProvider>
      </body>
    </html>
  );
}
