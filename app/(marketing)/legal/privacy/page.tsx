import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = { alternates: { canonical: "/legal/privacy" }, title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="13 November 2026">
      <p>This policy explains what personal information Brexoo handles, why, and the choices you have. It covers our website, the Brexoo application, and landing pages we host for our customers.</p>
      <h2>Two roles</h2>
      <p>For our own website and customer accounts, Brexoo decides how information is used. For enquiries submitted on a customer's landing page, the business you contacted decides how your information is used; Brexoo processes it on their behalf and does not share it with other businesses.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email, organisation and role.</li>
        <li>Enquiry details you choose to give a business: contact details, location, project description and answers to its questions, with a record of your consent.</li>
        <li>Demo requests: name, email, business and message.</li>
        <li>Technical data: a salted, one-way hash of IP address and browser used only to limit abuse. We do not store raw IP addresses for this purpose.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To deliver enquiries to the business you contacted and help them respond.</li>
        <li>To run, secure and support the service, including audit logs of sensitive actions.</li>
        <li>To provide AI features that summarise a business's own records for that business only.</li>
      </ul>
      <h2>Your choices</h2>
      <p>You can ask the business you contacted to stop contacting you; they can mark you as do-not-contact, which blocks outreach from Brexoo. You can ask us for access, correction, export or deletion by contacting us.</p>
      <h2>Retention and security</h2>
      <p>Data is kept while the customer's account is active and deleted or anonymised according to their retention settings and legal obligations. Data is encrypted in transit, access is limited by role, and each business's records are isolated from every other business.</p>
    </LegalPage>
  );
}
