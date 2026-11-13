import type { PageContent } from "@/features/landing-pages/content";

export type PublicQuestion = { key: string; label: string; kind: "text" | "select" | "yes_no" | "date"; options: string[]; required: boolean };

export type PublicPageData = {
  page_id: string;
  slug: string;
  title: string;
  content: PageContent;
  business: {
    name: string;
    website: string | null;
    phone: string | null;
    timezone: string;
    country: string;
    currency?: string;
    description: string | null;
    logo_url: string | null;
    address?: { city: string | null; state: string | null; county: string | null; postcode: string | null };
  };
  services: { code: string; name: string }[];
  areas: string[];
  places: PublicPlace[];
  questions: PublicQuestion[];
};

export type PublicPlace = { label: string; country: string; state: string | null; county: string | null; city: string | null; suburb: string | null; postcode: string | null; slug: string | null };
