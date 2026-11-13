import type { Tone } from "@/components/ui";

/** Page lifecycle labels (§7.5). Shared by server and client components. */
export const PAGE_STATUS: Record<string, { label: string; tone: Tone; help: string }> = {
  draft: { label: "Draft", tone: "neutral", help: "Edit freely. Submit when it's ready for approval." },
  internal_review: { label: "Internal review", tone: "violet", help: "Being checked by the Brexoo team." },
  awaiting_approval: { label: "Awaiting approval", tone: "amber", help: "An owner needs to approve this version before it can go live." },
  approved: { label: "Approved", tone: "teal", help: "Approved. Publish to make it live." },
  published: { label: "Live", tone: "green", help: "Visitors can see this page and send enquiries." },
  paused: { label: "Paused", tone: "amber", help: "Hidden from visitors. Resume to put it back." },
  archived: { label: "Archived", tone: "neutral", help: "No longer in use." },
};
