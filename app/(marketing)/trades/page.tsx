import type { Metadata } from "next";
import { IndustryPage } from "@/components/marketing/IndustryPage";
import { TRADE_CODES } from "@/components/marketing/industry-icons";

export const metadata: Metadata = { alternates: { canonical: "/trades" },
  title: "For trades and home services",
  description: "Electricians, plumbers, HVAC, roofers, landscapers, cleaners and more: capture jobs, qualify them fast and book the visit.",
};

export default function TradesPage() {
  return (
    <IndustryPage
      eyebrow="For trades & home services"
      title="Answer the right jobs first."
      body="Work type, urgency, access and property details, captured on a mobile-friendly page and lined up for your team, with follow-ups that don't slip."
      accent={["first"]}
      layout="tiles"
      sample="electricians"
      codes={TRADE_CODES}
      workflow={[
        { t: "A customer describes the job", b: "Residential or commercial, what needs doing, how urgent, and how to get on site." },
        { t: "It lands in your enquiry list", b: "With a follow-up task due within the response time you set, assigned to the right person." },
        { t: "Qualify in a minute", b: "See what's missing, record answers and qualify or disqualify with a reason." },
        { t: "Book the visit", b: "Phone call, video or site visit, with reschedules and no-shows kept on record." },
        { t: "Close it out", b: "Quote, won or lost. Reports show response times and win rate by service." },
      ]}
    />
  );
}
