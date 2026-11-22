import type { MetadataRoute } from "next";
import { TOOLS } from "../constants/tools.ts";
import { GUIDES } from "../constants/guides.ts";
import { SITE_URL } from "../lib/seo/structured-data.ts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
  const lastModified = new Date();

  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${baseUrl}${tool.route}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...coreRoutes, ...toolRoutes, ...guideRoutes];
}
