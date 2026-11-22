import type { ToolMetadata } from "@/types/tools";
import { getToolSeoData } from "../../constants/tool-seo.ts";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.printreadydesigns.in";

export function getWebsiteStructuredData(baseUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Print Ready Designs",
        "description":
          "Crop e-Aadhaar, PAN, and Ration cards to PVC print size, create 35×45mm Indian passport photos, straighten crooked documents, and build ATS resumes. 100% browser-based with zero file uploads.",
        "publisher": {
          "@id": `${baseUrl}/#organization`,
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${baseUrl}/tools?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Print Ready Designs",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/tab_logo1.png`,
          "width": 50,
          "height": 50,
        },
      },
    ],
  };
}

export function getToolSoftwareApplicationData(tool: ToolMetadata, baseUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": tool.name,
    "operatingSystem": "All modern web browsers (Chrome, Edge, Firefox, Safari)",
    "applicationCategory": tool.category === "utilities" ? "BusinessApplication" : "MultimediaApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "description": tool.description,
    "featureList": tool.features,
    "url": `${baseUrl}${tool.route}`,
    "browserRequirements": "Requires JavaScript and HTML5 Canvas/WebAssembly support",
    "permissions": "None. Runs entirely within client-side browser memory.",
  };
}

export function getToolFaqStructuredData(toolId: string) {
  const seoData = getToolSeoData(toolId);
  if (!seoData || !seoData.faqs || seoData.faqs.length === 0) {
    return null;
  }
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": seoData.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}
