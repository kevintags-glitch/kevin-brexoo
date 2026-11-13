import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = { alternates: { canonical: "/legal/acceptable-use" }, title: "Acceptable use" };

export default function AcceptableUsePage() {
  return (
    <LegalPage title="Acceptable use policy" updated="13 November 2026">
      <p>To keep Brexoo trustworthy for businesses and the people who contact them, you may not use it to:</p>
      <ul>
        <li>Send unsolicited marketing without a lawful basis, or ignore opt-out requests.</li>
        <li>Collect personal information under false pretences or impersonate another business.</li>
        <li>Upload content you don't have the rights to, or that is misleading about your licences, prices or availability.</li>
        <li>Attempt to access another organisation's data, probe for vulnerabilities without permission, or overload the service.</li>
        <li>Use the AI assistants to produce deceptive, unsafe or unlawful advice.</li>
      </ul>
      <p>We may suspend accounts that breach this policy and will tell you why unless the law prevents it.</p>
    </LegalPage>
  );
}
