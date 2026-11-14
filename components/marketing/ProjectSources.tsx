import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandIcon, type BrandIconName } from "./brand-icons";
import { cn } from "@/lib/cn";

/** The path every opportunity takes, as shown in the product. */
export const SOURCE_FLOW: { icon: BrandIconName; step: string; body: string }[] = [
  { icon: "source", step: "Source", body: "Your page, chat, calls and registered project sources" },
  { icon: "shield", step: "Verify", body: "Source, dates and contact permission recorded" },
  { icon: "fit", step: "Score", body: "Explainable fit and inferred buying intent" },
  { icon: "notification", step: "Notify", body: "Alert and a follow-up task, straight away" },
  { icon: "phone", step: "Respond", body: "Call, reply or book a site visit from the record" },
];

/**
 * Exactly how Brexoo finds projects, answered from the product's real rules: where opportunities
 * come from, how they're verified, how enquiries and buying intent are identified, who else sees
 * them and how a builder is told and responds.
 */
export const SOURCE_ANSWERS: { id: string; icon: BrandIconName; q: string; a: string; points: string[] }[] = [
  {
    id: "origin",
    icon: "discover",
    q: "Where do opportunities come from?",
    a: "Four places, and every record says which one.",
    points: [
      "Enquiries from your Brexoo landing page and its chat",
      "Calls, walk-ins and referrals you log yourself",
      "Project records from sources you register and are allowed to use, such as council DA, permit and tender registers",
      "Business prospects like developers and property managers",
    ],
  },
  {
    id: "verify",
    icon: "shield",
    q: "How are projects verified?",
    a: "A source has to be registered before anything is imported from it.",
    points: [
      "Each source is recorded with its terms and permitted use",
      "Every record keeps its source, the date it was observed and the date it was imported",
      "Records marked “contact not permitted” can be researched but not contacted",
      "Only records from a registered source are labelled Verified project",
    ],
  },
  {
    id: "enquiries",
    icon: "inbox",
    q: "How are homeowner enquiries identified?",
    a: "Only when the person contacts you. Nothing is labelled an enquiry by guesswork.",
    points: [
      "They fill in your page's form, use its chat, or call and you log it",
      "Consent and the wording they agreed to are recorded with the enquiry",
      "Rate limits block floods of submissions, and repeat enquiries from the same person are linked, not double-counted",
      "These are the only records labelled Direct enquiry",
    ],
  },
  {
    id: "intent",
    icon: "intent",
    q: "How is buying intent calculated?",
    a: "From dated evidence on the record, and always labelled inferred.",
    points: [
      "Booked appointment +3 · asked for a site visit +2 · wants to start within a month +2",
      "Stated a budget, owns the land, is the decision-maker, got in touch again, detailed brief, enquired in the last 3 days: +1 each",
      "Start 6+ months away, doesn't own the land yet, or no booking after 45 days: −1 each",
      "5+ is High, 3+ Medium, otherwise Low; fewer than two signals is “Not enough evidence”",
    ],
  },
  {
    id: "exclusive",
    icon: "consent",
    q: "Are leads shared with other builders?",
    a: "No. Brexoo doesn't sell, share or auction leads.",
    points: [
      "Enquiries to your page go only to your workspace",
      "Imported records come only from sources you register",
      "Each business's data is isolated, in the app and by row-level security in the database",
      "There's no lead marketplace and no pay-per-lead",
    ],
  },
  {
    id: "respond",
    icon: "notification",
    q: "How do I receive and respond?",
    a: "The moment an enquiry arrives, it's in front of you with a task due.",
    points: [
      "An in-app alert, plus a follow-up task due within your response target (4 hours unless you change it)",
      "Email, SMS or Slack alerts through your Make.com scenarios",
      "Overdue follow-ups rise to the top of your dashboard",
      "Brex AI drafts the reply or call script; you approve it, then call, reply or book a site visit",
    ],
  },
];

export function SourceFlow({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-5", className)} aria-label="How an opportunity reaches you">
      {SOURCE_FLOW.map((s, i) => (
        <li key={s.step} className="relative flex items-start gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-col sm:gap-3">
          <BrandIcon name={s.icon} tone={(["navy", "blue", "teal", "navy", "blue"] as const)[i]} className="size-11 shrink-0" />
          <span>
            <span className="text-[12px] font-medium tabular text-ink-3">0{i + 1}</span>
            <span className="type-card block">{s.step}</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{s.body}</span>
          </span>
          {i < SOURCE_FLOW.length - 1 ? <ArrowRight aria-hidden className="absolute -right-[13px] top-1/2 z-10 hidden size-4 -translate-y-1/2 rounded-full bg-white text-ink-3 sm:block" /> : null}
        </li>
      ))}
    </ol>
  );
}

export function ProjectSources({ detailed = false }: { detailed?: boolean }) {
  return (
    <div>
      <SourceFlow />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SOURCE_ANSWERS.map((s, i) => (
          <article key={s.id} id={detailed ? `sources-${s.id}` : undefined} className="flex flex-col rounded-[22px] border border-line bg-white p-6">
            <BrandIcon name={s.icon} tone={(["cloud", "navy", "cloud", "blue", "teal", "navy"] as const)[i]} className="size-12" />
            <h3 className="type-card mt-5">{s.q}</h3>
            <p className="type-body mt-1.5 text-ink-2">{s.a}</p>
            <ul className="mt-4 grid gap-2 border-t border-line pt-4">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-2">
                  <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {detailed ? null : (
        <Link href="/how-it-works#sources" className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-blue hover:gap-2.5">
          The full sourcing rules <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
