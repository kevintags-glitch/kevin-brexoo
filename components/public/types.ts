import type { PageContent } from "@/features/landing-pages/content";

export type PublicQuestion = { key: string; label: string; kind: "text" | "select" | "yes_no" | "date"; options: string[]; required: boolean };

export type PublicPageData = {
  page_id: string;
  slug: string;
  title: string;
  content: PageContent;
  business: { name: string; website: string | null; phone: string | null; timezone: string; country: string; description: string | null; logo_url: string | null };
  services: { code: string; name: string }[];
  areas: string[];
  questions: PublicQuestion[];
};
