import type { Metadata } from "next";
import { IndustryPage } from "@/components/marketing/IndustryPage";
import { BUILDER_CODES } from "@/components/marketing/industry-icons";

export const metadata: Metadata = {
  title: "For builders and developers",
  description: "Capture and qualify new-build, extension and renovation enquiries, and keep every project moving to a site visit and a decision.",
};

export default function BuildersPage() {
  return (
    <IndustryPage
      eyebrow="For builders & developers"
      title="Every build enquiry, qualified before you quote."
      body="Land status, house type, budget range, timing and the decision-maker, captured up front and checked against your service area, so consultations go to the right projects."
      layout="zigzag"
      codes={BUILDER_CODES}
      workflow={[
        { t: "A landowner enquires from your page", b: "They answer a few questions at a time: land, location, build type, timing. “Not sure” is always allowed." },
        { t: "Brexoo checks the fit", b: "Service, location, timing and stated budget, factor by factor, with anything missing listed." },
        { t: "You reply with a draft you approve", b: "Brex AI drafts a follow-up from the record. You edit it and send it from your own email." },
        { t: "Book the consultation or site visit", b: "In your time zone, with status tracked through to attended or rescheduled." },
        { t: "Record the outcome", b: "Estimate, won or lost with a reason, so you learn which enquiries become builds." },
      ]}
    />
  );
}
