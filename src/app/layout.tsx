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
    default: "Print Ready Designs – Free Aadhaar/PAN Card Cropper, Passport Photo & Resume Maker",
    template: "%s | Print Ready Designs",
  },
  description:
    "Crop e-Aadhaar, PAN, and Ration cards to PVC print size, create 35×45mm Indian passport photos, straighten crooked documents, and build ATS resumes. 100% browser-based with zero file uploads.",
  applicationName: "Print Ready Designs",
  authors: [{ name: "Print Ready Designs" }],
  keywords: [
    "print ready designs",
    "free aadhaar card crop tool",
    "aadhaar card cropper",
    "free pan card crop tool",
    "pan card cropper",
    "free ration card crop tool",
    "ration card cropper",
    "pvc print size card crop",
    "free passport photo studio",
    "35x45mm indian passport photo",
    "passport photo maker",
    "free background remover",
    "document straightener",
    "multiple photo maker",
    "resume maker",
    "free resume cv maker",
    "ats resume builder",
    "free online tools",
    "free online document cropper",
    "in-browser photo editor",
    "client-side pdf",
    "zero-upload privacy",
    "all free online utilities",
  ],
  creator: "Print Ready Designs",
  publisher: "Print Ready Designs",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Print Ready Designs",
    title: "Print Ready Designs – Free Aadhaar/PAN Card Cropper, Passport Photo & Resume Maker",
    description:
      "Crop e-Aadhaar, PAN, and Ration cards to PVC print size, create 35×45mm Indian passport photos, straighten crooked documents, and build ATS resumes. 100% browser-based with zero file uploads.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Print Ready Designs – Free Aadhaar/PAN Card Cropper, Passport Photo & Resume Maker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Print Ready Designs – Free Aadhaar/PAN Card Cropper, Passport Photo & Resume Maker",
    description:
      "Crop e-Aadhaar, PAN, and Ration cards to PVC print size, create 35×45mm Indian passport photos, straighten crooked documents, and build ATS resumes. 100% browser-based with zero file uploads.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
