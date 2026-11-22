import type { GuideItem } from "../../constants/guides.ts";
import { SITE_URL } from "./structured-data.ts";

export function getGuideBreadcrumbSchema(guide: GuideItem, baseUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Guides",
        "item": `${baseUrl}/guides`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": guide.title,
        "item": `${baseUrl}/guides/${guide.slug}`,
      },
    ],
  };
}

export function getGuidesIndexBreadcrumbSchema(baseUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Guides",
        "item": `${baseUrl}/guides`,
      },
    ],
  };
}

export function getGuideArticleSchema(guide: GuideItem, baseUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.metaDescription,
    "inLanguage": "en-IN",
    "mainEntityOfPage": `${baseUrl}/guides/${guide.slug}`,
    "datePublished": guide.publishedAt,
    "dateModified": guide.updatedAt,
    "author": {
      "@type": "Organization",
      "name": "Print Ready Designs Editorial Team",
      "url": baseUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Print Ready Designs",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/tab_logo1.png`,
      },
    },
  };
}

export function getGuideHowToSchema(guide: GuideItem, baseUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": guide.title,
    "description": guide.metaDescription,
    "step": guide.steps.map((s) => ({
      "@type": "HowToStep",
      "position": s.stepNumber,
      "name": s.title,
      "itemListElement": [
        {
          "@type": "HowToDirection",
          "text": s.description,
        },
      ],
    })),
  };
}

export function getGuideFaqSchema(guide: GuideItem) {
  if (!guide.faqs || guide.faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": guide.faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };
}
