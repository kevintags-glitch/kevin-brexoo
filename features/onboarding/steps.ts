/** Onboarding wizard steps (blueprint §6.2) and the activation checklist (§6.4). */

export const STEPS = [
  { id: "business", title: "Business", description: "Who you are and how to reach you" },
  { id: "services", title: "Services", description: "What you offer and where" },
  { id: "ideal", title: "Ideal work", description: "The jobs you want more of" },
  { id: "qualification", title: "Qualification", description: "What you need to know first" },
  { id: "brand", title: "Brand", description: "How you present yourself" },
  { id: "operations", title: "Operations", description: "Who responds, and how fast" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const ONBOARDING_STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted for review",
  needs_changes: "Needs changes",
  approved: "Approved",
  active: "Active",
};

export type ChecklistInput = {
  org: { phone: string | null; website: string | null; contact_name: string | null; settings: Record<string, unknown> };
  servicesCount: number;
  areasCount: number;
  questionsCount: number;
  pages: { status: string }[];
  membersCount: number;
  onboardingStatus: string;
};

export type ChecklistItem = { id: string; label: string; done: boolean; href: string };

export function activationChecklist(i: ChecklistInput): ChecklistItem[] {
  const brand = (i.org.settings.brand ?? {}) as { description?: string };
  const ops = (i.org.settings.operations ?? {}) as { response_hours?: number; notify_emails?: string[] };
  const pageApproved = i.pages.some((p) => ["approved", "published", "paused"].includes(p.status));
  return [
    { id: "profile", label: "Business profile complete", done: Boolean(i.org.contact_name && (i.org.phone || i.org.website)), href: "/app/onboarding?step=business" },
    { id: "services", label: "At least one service and service area", done: i.servicesCount > 0 && i.areasCount > 0, href: "/app/onboarding?step=services" },
    { id: "qualification", label: "Qualification questions reviewed", done: i.questionsCount > 0, href: "/app/onboarding?step=qualification" },
    { id: "brand", label: "Company description added", done: Boolean(brand.description), href: "/app/onboarding?step=brand" },
    { id: "notifications", label: "Response time and notifications set", done: Boolean(ops.response_hours), href: "/app/onboarding?step=operations" },
    { id: "page", label: "Landing page approved", done: pageApproved, href: "/app/landing-pages" },
    { id: "published", label: "Landing page published", done: i.pages.some((p) => p.status === "published"), href: "/app/landing-pages" },
    { id: "team", label: "Team members invited", done: i.membersCount > 1, href: "/app/settings/team" },
  ];
}
