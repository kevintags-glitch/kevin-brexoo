import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = { alternates: { canonical: "/legal/terms" }, title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="13 November 2026">
      <p>These terms govern your use of Brexoo. By creating an account you agree to them on behalf of your organisation.</p>
      <h2>The service</h2>
      <p>Brexoo provides software to capture, qualify and manage opportunities, and optional managed services scoped in a separate schedule. Brexoo does not guarantee leads, appointments, contracts or revenue.</p>
      <h2>Your responsibilities</h2>
      <ul>
        <li>Keep account credentials secure and give team members only the access they need.</li>
        <li>Contact people only where you have a lawful basis and respect opt-outs.</li>
        <li>Make sure content you publish on landing pages is accurate and that you have permission to use it.</li>
      </ul>
      <h2>Your data</h2>
      <p>You own your organisation's data. We process it to provide the service and do not sell it or share your customer-private enquiries with other businesses.</p>
      <h2>Plans and billing</h2>
      <p>Plan limits, fees and billing terms are shown on our pricing page and confirmed in your order. Published prices are illustrative until confirmed in writing.</p>
    </LegalPage>
  );
}
