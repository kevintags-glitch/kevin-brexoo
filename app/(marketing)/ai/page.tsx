import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { BrexMock, FitCardMock, PhonePageMock } from "@/components/marketing/mocks";
import { SlideIn, WipeIn, WordsReveal, ZoomIn } from "@/components/marketing/motion";
import { ProductVideo } from "@/components/marketing/ProductVideo";
import { BREX_AI_DEMO } from "@/config/media";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, Eyebrow, SectionHeading } from "@/components/marketing/Section";

export const metadata: Metadata = { alternates: { canonical: "/ai" },
  title: "Brex AI",
  description: "Brex AI summarises enquiries, explains fit and drafts replies for your approval. The visitor assistant answers only from content you've approved.",
};

const CAN = ["Summarise an enquiry and quote the record it came from", "Explain why a record matches your criteria, or doesn't", "List the qualification details still missing", "Draft a follow-up for you to review", "Prepare a consultation or site-visit brief", "Find overdue tasks and suggest priorities", "Summarise your pipeline from your own data"];
const CANNOT = ["Send emails or messages", "Book, cancel or move appointments", "Delete or export records", "Change billing or settings", "See any other business's data", "Invent prices, availability or technical advice"];

export default function AiPage() {
  return (
    <>
      <PageHero
        variant="split"
        aside={<BrexMock />}
        eyebrow="Brex AI"
        title="AI that helps you act. People who decide." accent={["decide"]}
        body="Two assistants with deliberately narrow jobs: Brex AI inside your workspace, and a visitor assistant on your landing page. Both work only from approved, scoped information."
      >
        <ButtonLink href="/demo" size="lg">
          See it in a demo
        </ButtonLink>
      </PageHero>

      <section className="bg-[linear-gradient(180deg,#ffffff,#f4f9ff)] py-20 sm:py-28">
        <Container className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28">
            <Eyebrow>Watch it work</Eyebrow>
            <WordsReveal text="Ask in plain words. Get answers from your records." className="type-section mt-4 max-w-[16ch]" />
            <p className="type-body mt-5 max-w-md text-ink-2">An 18-second look at Brex AI on a real sample lead. Every answer cites the record it came from, and anything inferred says so.</p>
          </div>
          <ProductVideo {...BREX_AI_DEMO} />
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container className="grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Brex AI" title="Your assistant inside Brexoo." body="Brex AI reads your own records, read-only, through a short list of allowed tools. Every answer points back to the record it came from." />
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <SlideIn from="left">
                <p className="text-[14px] font-medium">Brex AI can</p>
                <ul className="mt-3 grid gap-2.5">
                  {CAN.map((c) => (
                    <li key={c} className="flex gap-2.5 text-[14px] text-ink-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-green-ink" aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </SlideIn>
              <SlideIn from="right" delay={0.08}>
                <p className="text-[14px] font-medium">Brex AI cannot</p>
                <ul className="mt-3 grid gap-2.5">
                  {CANNOT.map((c) => (
                    <li key={c} className="flex gap-2.5 text-[14px] text-ink-2">
                      <X className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </SlideIn>
            </div>
          </div>
          <ZoomIn>
            <FitCardMock />
          </ZoomIn>
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
            <ul className="type-body mt-8 grid gap-3 text-ink-2">
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
          <SectionHeading eyebrow="Controls" title="Safety is a feature, not a footnote." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ["Tenant-scoped retrieval", "The assistant authenticates you first and can only read your organisation's records. Database policies enforce the same rule."],
              ["No open database access", "No free-form SQL. A short list of validated, read-only tools, with reads and writes kept separate."],
              ["Untrusted input stays data", "Emails, form text and web content are treated as data, never as instructions, to resist prompt injection."],
              ["Usage budgets", "Requests are counted against your plan each month, so costs stay predictable."],
              ["Logged, minimally", "Tool calls and failures are recorded without copying sensitive content into logs."],
              ["Human approval", "Sending, booking, deleting, exporting and billing changes always need a person."],
            ].map(([t, b], i) => (
              <WipeIn key={t} delay={(i % 3) * 0.1} className="rounded-[24px] border border-line bg-white p-7 shadow-xs">
                <p className="text-[13px] text-ink-3 tabular">{String(i + 1).padStart(2, "0")}</p>
                <p className="type-body mt-4">{t}</p>
                <p className="type-body mt-2 text-ink-3">{b}</p>
              </WipeIn>
            ))}
          </div>
        </Container>
      </section>
      <CtaBand title="Try Brex AI on your own enquiries." body="We'll show what it can summarise, and exactly where it stops.">
        <ButtonLink href="/demo" variant="inverse" size="lg">
          Request a demo
        </ButtonLink>
      </CtaBand>
    </>
  );
}
