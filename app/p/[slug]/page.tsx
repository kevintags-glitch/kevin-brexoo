import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicLanding } from "@/components/public/PublicLanding";
import { JsonLd } from "@/components/seo/JsonLd";
import { businessJsonLd, loadPublicPage, pageUrl } from "@/features/public/page-data";

export const revalidate = 60;

const load = loadPublicPage;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await load(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: { absolute: `${page.content.headline} · ${page.business.name}` },
    description: page.content.subheadline || page.business.description || undefined,
    alternates: { canonical: pageUrl(page.slug) },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await load(slug);
  if (!page) notFound();
  return (
    <>
      <JsonLd data={businessJsonLd(page, { url: pageUrl(page.slug), places: page.places })} />
      <PublicLanding data={page} />
    </>
  );
}
