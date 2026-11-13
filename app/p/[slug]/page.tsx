import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PublicLanding } from "@/components/public/PublicLanding";
import type { PublicPageData } from "@/components/public/types";
import { parsePageContent } from "@/features/landing-pages/content";
import { createAnonClient } from "@/lib/supabase/server";

export const revalidate = 60;

const load = cache(async (slug: string): Promise<PublicPageData | null> => {
  const { data } = await createAnonClient().rpc("get_public_page", { p_slug: slug });
  if (!data) return null;
  const raw = data as unknown as PublicPageData & { content: unknown };
  return { ...raw, content: parsePageContent(raw.content) };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await load(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: { absolute: `${page.content.headline} · ${page.business.name}` },
    description: page.content.subheadline || page.business.description || undefined,
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await load(slug);
  if (!page) notFound();
  return <PublicLanding data={page} />;
}
