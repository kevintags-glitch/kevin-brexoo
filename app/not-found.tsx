import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Link href="/" aria-label="Brexoo home">
        <Logo knockout="var(--canvas)" />
      </Link>
      <h1 className="mt-10 text-[34px] font-medium tracking-[-0.025em]">We couldn't find that page.</h1>
      <p className="mt-2 max-w-sm text-[15px] text-ink-3">It may have moved, or the link may be incomplete. If it's a business's page, it may be paused.</p>
      <ButtonLink href="/" className="mt-8" variant="secondary">
        Back to Brexoo
      </ButtonLink>
    </div>
  );
}
