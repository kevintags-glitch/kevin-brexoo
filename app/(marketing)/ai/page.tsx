import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { PhonePageMock, XooMock } from "@/components/marketing/mocks";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, SectionHeading } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Brexoo AI",
  description: "Xoo AI summarises enquiries, explains fit and drafts replies for your approval. The visitor assistant answers only from content you've approved.",
};

const CAN = ["Summarise an enquiry and quote the record it came from", "Explain why a record matches your criteria, or doesn't", "List the qualification details still missing", "Draft a follow-up for you to review", "Prepare a consultation or site-visit brief", "Find overdue tasks and suggest priorities", "Summarise your pipeline from your own data"];
const CANNOT = ["Send emails or messages", "Book, cancel or move appointments", "Delete or export records", "Change billing or settings", "See any other business's data", "Invent prices, availability or technical advice"];

export default function AiPage() {
  return (
    <>
      <PageHero
        eyebrow="Brexoo AI"
        title="AI that helps you act. People who decide."
        body="Two assistants with deliberately narrow jobs: Xoo AI inside your workspace, and a visitor assistant on your landing page. Both work only from approved, scoped information."
      >
        <ButtonLink href="/demo" size="lg">
          See it in a demo
        </ButtonLink>
      </PageHero>

      <section className="py-20 sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Xoo AI" title="Your assistant inside Brexoo." body="Xoo reads your own records, read-only, through a short list of allowed tools. Every answer points back to the record it came from." />
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <Reveal>
                <p className="text-[14px] font-semibold">Xoo can</p>
                <ul className="mt-3 grid gap-2.5">
                  {CAN.map((c) => (
                    <li key={c} className="flex gap-2.5 text-[14px] text-ink-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-green-ink" aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.05}>
                <p className="text-[14px] font-semibold">Xoo cannot</p>
                <ul className="mt-3 grid gap-2.5">
                  {CANNOT.map((c) => (
                    <li key={c} className="flex gap-2.5 text-[14px] text-ink-2">
                      <X className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
          <Reveal>
            <XooMock />
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-surface py-20 sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <Reveal className="order-last lg:order-first">
            <PhonePageMock />
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="Visitor assistant"
              title="Answers from your page, and nothing else."
              body="On your landing page, the assistant answers from your approved FAQs, services and areas, then collects project details a few questions at a time."
            />
            <ul className="mt-8 grid gap-3 text-[15px] text-ink-2">
              {[
                "Says when it doesn't know, and offers to pass the question to you",
                "Shows a privacy notice and asks for consent before collecting details",
                "Confirms the summary with the visitor before creating an enquiry",
                "Makes clear that a conversation is not a confirmed booking",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-teal" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Controls" title="Safety is a feature, not a footnote." align="center" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ["Tenant-scoped retrieval", "The assistant authenticates you first and can only read your organisation's records. Database policies enforce the same rule."],
              ["No open database access", "No free-form SQL. A short list of validated, read-only tools, with reads and writes kept separate."],
              ["Untrusted input stays data", "Emails, form text and web content are treated as data, never as instructions, to resist prompt injection."],
              ["Usage budgets", "Requests are counted against your plan each month, so costs stay predictable."],
              ["Logged, minimally", "Tool calls and failures are recorded without copying sensitive content into logs."],
              ["Human approval", "Sending, booking, deleting, exporting and billing changes always need a person."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={(i % 3) * 0.04} className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
                <p className="text-[16px] font-semibold">{t}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">{b}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
      <CtaBand title="Try Xoo on your own enquiries." body="We'll show what it can summarise, and exactly where it stops.">
        <ButtonLink href="/demo" variant="inverse" size="lg">
          Request a demo
        </ButtonLink>
      </CtaBand>
    </>
  );
}
