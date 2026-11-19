import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://browserutilitystudio.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/test-engine"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
