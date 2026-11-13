/**
 * Brex AI support on the Brexoo website. Like the visitor assistant, it answers only from approved
 * content (the topics below) and says when it doesn't know, offering a person instead of guessing.
 */
import { tokens } from "@/features/visitor-chat/engine";

export type SupportLink = { href: string; label: string };
export type SupportReply = { text: string; links: SupportLink[]; known: boolean };

type Topic = { keys: string; text: string; links: SupportLink[] };

const TOPICS: Topic[] = [
  {
    keys: "what is brexoo platform about do does overview explain",
    text: "Brexoo is the AI growth platform for builders and home-service businesses. It helps you discover project leads, qualify them with an explainable fit score, follow up and book appointments, all in one workspace.",
    links: [{ href: "/how-it-works", label: "How it works" }],
  },
  {
    keys: "price pricing cost costs plan plans much fee fees setup monthly subscription billing",
    text: "Plans start at $299 a month (Launch), with Growth at $699 and Managed at $1,999, plus a one-off setup fee. These are illustrative pilot prices in USD; final pricing and currency are confirmed before billing.",
    links: [{ href: "/pricing", label: "Compare plans" }],
  },
  {
    keys: "country countries market markets usa us america united states australia new zealand nz au where launch available region",
    text: "Brexoo launches in the United States, Australia and New Zealand. Each business works in its own time zone and currency.",
    links: [{ href: "/#markets", label: "Where we launch" }],
  },
  {
    keys: "industry industries trade trades builder builders electrician plumber plumbing hvac roofing painting landscaping lawn cleaning renovation remodelling developer",
    text: "Brexoo is built for builders and developers, electricians, plumbers, HVAC, renovation and remodelling, landscaping and lawn care, cleaning, and roofing and painting, with 15 service templates in total.",
    links: [
      { href: "/industries", label: "All industries" },
      { href: "/builders", label: "For builders" },
      { href: "/trades", label: "For trades" },
    ],
  },
  {
    keys: "brex ai assistant artificial intelligence send email automatically contact customers draft summary",
    text: "Brex AI summarises leads, explains fit, suggests the next best action and drafts follow-ups. It reads only your own records and never sends, books or deletes anything without a person approving it.",
    links: [{ href: "/ai", label: "Meet Brex AI" }],
  },
  {
    keys: "lead leads guarantee guaranteed jobs results more work get",
    text: "Brexoo doesn't guarantee leads or jobs. It helps you capture, qualify and follow up opportunities faster; results depend on your market, your offer and how you respond.",
    links: [{ href: "/how-it-works", label: "See the workflow" }],
  },
  {
    keys: "source sources data project projects discover discovery where come from verified intent signal predicted",
    text: "Leads come from your landing page and chat, records you add, and project sources you register and are allowed to use. Brexoo keeps verified projects, direct enquiries, business prospects and inferred intent signals apart, and never shows a prediction as a confirmed request.",
    links: [{ href: "/resources#record-types", label: "The four record types" }],
  },
  {
    keys: "landing page website form enquiry enquiries capture chat widget",
    text: "Brexoo generates a landing page from your services and service area. Visitors enquire through a short, mobile-friendly form or the chat assistant, and each enquiry arrives with a follow-up task.",
    links: [{ href: "/how-it-works#discover", label: "How capture works" }],
  },
  {
    keys: "managed service services human team people agents qualify call calls for me",
    text: "Managed services add a human team that qualifies and follows up inside your workspace, with hours, channels and limits agreed in writing. It's part of the Managed plan.",
    links: [{ href: "/managed-services", label: "Managed services" }],
  },
  {
    keys: "privacy security secure safe data gdpr isolation rls encrypted",
    text: "Each business's data is isolated in the app and by row-level security in the database, sensitive actions are audited, and data is encrypted in transit.",
    links: [{ href: "/legal/privacy", label: "Privacy policy" }],
  },
  {
    keys: "integrations integrate make zapier webhook gmail calendar stripe crm connect notifications",
    text: "Today Brexoo can send new-lead and booking events to Make.com through a signed webhook. Email, calendar and payment connections are on the roadmap.",
    links: [{ href: "/demo", label: "Ask about integrations" }],
  },
  {
    keys: "demo trial start sign signup account try free talk sales human person contact",
    text: "You can request a 30-minute demo set up with your own services and service area, or create an account and start onboarding straight away.",
    links: [
      { href: "/demo", label: "Request a demo" },
      { href: "/signup", label: "Create an account" },
    ],
  },
];

const PREPARED = TOPICS.map((t) => ({ ...t, tk: new Set(tokens(t.keys)) }));

export function supportAnswer(question: string): SupportReply {
  const qt = tokens(question);
  if (!qt.length) return { text: "Ask me about Brexoo's features, pricing, industries or markets.", links: [], known: false };
  let best = { score: 0, topic: undefined as (typeof PREPARED)[number] | undefined };
  for (const t of PREPARED) {
    const score = qt.filter((w) => t.tk.has(w)).length;
    if (score > best.score) best = { score, topic: t };
  }
  if (best.topic) return { text: best.topic.text, links: best.topic.links, known: true };
  return {
    text: "I don't know that one, and I'd rather not guess. Our team can answer it for you.",
    links: [{ href: "/demo", label: "Talk to our team" }],
    known: false,
  };
}

export const SUPPORT_SUGGESTIONS = ["What is Brexoo?", "How much does it cost?", "Which countries?", "Will Brex AI email my customers?"];
