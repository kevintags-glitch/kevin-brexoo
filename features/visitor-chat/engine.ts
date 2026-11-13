/**
 * Visitor assistant for public landing pages (blueprint §10.2).
 *
 * Deliberately grounded: it answers only from the business's approved page content (FAQs,
 * services, areas, contact details). When nothing matches it says so and offers a handoff. It
 * never invents prices, availability, licensing, warranties or technical advice.
 */

export type ChatKnowledge = {
  businessName: string;
  phone?: string | null;
  responseText?: string | null;
  services: { code: string; name: string }[];
  areas: string[];
  faqs: { q: string; a: string }[];
};

export type ChatAnswer =
  | { kind: "answer"; text: string; source: string }
  | { kind: "refuse"; text: string; source: string }
  | { kind: "unknown"; text: string };

const STOP = new Set(
  "a an the and or but is are am be do does did you your yours we our us i me my to of in on for with at by from it its this that these those can could would should will what which who whom how when where why there here have has had any some about please".split(
    " ",
  ),
);

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => t.replace(/(ing|ed|es|s)$/, ""));
}

function overlap(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const set = new Set(b);
  return a.filter((t) => set.has(t)).length / Math.sqrt(a.length * b.length);
}

const GENERIC = new Set(["home", "house", "property", "commercial", "residential", "service", "care", "control", "contractor", "and"]);

const PRICE = /\b(price|pricing|cost|costs|how much|quote|rate|rates|charge|fee|fees|\$)\b/i;
const AVAILABILITY = /\b(available|availability|book|booking|appointment|when can you|schedule|slot|tomorrow|today|this week)\b/i;
const ADVICE = /\b(warranty|guarantee|licen[cs]e|licensed|insured|insurance|code compliant|safe to|is it safe|legal)\b/i;
const AREAS = /\b(area|areas|suburb|suburbs|where do you|cover|service area|travel|location|locations)\b/i;
const SERVICES = /\b(services|what do you do|offer|do you do|types of work|what work)\b/i;
const CONTACT = /\b(phone|call|contact|email|speak|talk to|human|person|someone)\b/i;

export function answer(question: string, kb: ChatKnowledge): ChatAnswer {
  const q = question.trim();
  if (!q) return { kind: "unknown", text: "Ask me anything about the services, areas or how to enquire." };
  const qt = tokens(q);

  // An approved FAQ always wins when it clearly matches.
  let best: { score: number; faq?: { q: string; a: string } } = { score: 0 };
  for (const faq of kb.faqs) {
    const score = overlap(qt, tokens(faq.q)) * 1.0 + overlap(qt, tokens(faq.a)) * 0.35;
    if (score > best.score) best = { score, faq };
  }
  if (best.faq && best.score >= 0.45) return { kind: "answer", text: best.faq.a, source: "FAQ" };

  if (PRICE.test(q)) {
    return {
      kind: "refuse",
      text: `I can't give prices. ${kb.businessName} prepares quotes after reviewing your project details. If you start an enquiry, they'll come back to you with next steps.`,
      source: "Policy",
    };
  }
  if (ADVICE.test(q)) {
    return {
      kind: "refuse",
      text: `That's best answered by ${kb.businessName} directly, so you get accurate details. I can pass your question on as part of an enquiry.`,
      source: "Policy",
    };
  }
  if (AVAILABILITY.test(q)) {
    return {
      kind: "refuse",
      text: `I can't check availability or book times. ${kb.businessName} will confirm any appointment with you directly. Chatting here isn't a booking.`,
      source: "Policy",
    };
  }
  if (AREAS.test(q) && kb.areas.length) {
    // Specific place asked about: say whether it's listed, never guess beyond the list.
    const hit = kb.areas.find((a) => qt.some((t) => tokens(a).includes(t)));
    if (hit) return { kind: "answer", text: `Yes, ${hit} is one of the listed service areas.`, source: "Service areas" };
    return { kind: "answer", text: `${kb.businessName} lists these service areas: ${kb.areas.join(", ")}. If you're nearby, ask in an enquiry and they'll confirm.`, source: "Service areas" };
  }
  // Service name mentioned directly ("do you do roofing?"). Generic words like "home" don't count,
  // so "home address" doesn't read as a question about home building.
  const svc = kb.services.find((s) => tokens(s.name).some((t) => !GENERIC.has(t) && qt.includes(t)));
  if (svc) return { kind: "answer", text: `Yes, ${kb.businessName} offers ${svc.name.toLowerCase()}.`, source: "Services" };
  if (SERVICES.test(q) && kb.services.length) {
    return { kind: "answer", text: `${kb.businessName} offers: ${kb.services.map((s) => s.name.toLowerCase()).join(", ")}.`, source: "Services" };
  }
  if (CONTACT.test(q)) {
    return {
      kind: "answer",
      text: kb.phone ? `You can call ${kb.businessName} on ${kb.phone}, or start an enquiry here and they'll get back to you${kb.responseText ? ` ${kb.responseText}` : ""}.` : `Start an enquiry here and ${kb.businessName} will get back to you${kb.responseText ? ` ${kb.responseText}` : ""}.`,
      source: "Contact details",
    };
  }
  if (best.faq && best.score >= 0.3) return { kind: "answer", text: best.faq.a, source: "FAQ" };

  return {
    kind: "unknown",
    text: `I don't know the answer to that one, and I'd rather not guess. I can pass your question to ${kb.businessName} as part of an enquiry.`,
  };
}
