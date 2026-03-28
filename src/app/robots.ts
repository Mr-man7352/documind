import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/onboarding/"],
    },
    sitemap: "https://documind-lac.vercel.app/sitemap.xml",
  };
}
