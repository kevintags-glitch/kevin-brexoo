import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { ResetForm } from "@/components/app/AuthForms";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPage() {
  await requireUser();
  return <ResetForm />;
}
