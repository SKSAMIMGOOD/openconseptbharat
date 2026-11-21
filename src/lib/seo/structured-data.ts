import type { ToolMetadata } from "@/types/tools";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.printreadydesigns.in";

export function getWebsiteStructuredData(baseUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Browser Utility Studio",
        "description":
          "100% free online tools for photo editing, passport photos, background remover, government ID card cropping, and resume making with zero server uploads.",
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
        "name": "Browser Utility Studio",
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
