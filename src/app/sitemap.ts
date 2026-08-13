import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import {
  getCollections,
  getProducts,
} from "@/features/catalog/data/products-db";

const locales = ["en", "ar"] as const;
const staticPaths = ["", "/catalog", "/collections"];

function makeEntry(lang: string, path: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}/${lang}${path}`,
    lastModified: new Date(),
    alternates: {
      languages: {
        en: `${siteUrl}/en${path}`,
        ar: `${siteUrl}/ar${path}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getProducts(),
    getCollections(),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  for (const lang of locales) {
    for (const path of staticPaths) {
      entries.push(makeEntry(lang, path));
    }
    for (const collection of collections) {
      entries.push(makeEntry(lang, `/collections/${collection.slug}`));
    }
    for (const product of products) {
      entries.push(makeEntry(lang, `/product/${product.slug}`));
    }
  }
  return entries;
}
