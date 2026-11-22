import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo/structured-data.ts";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
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
