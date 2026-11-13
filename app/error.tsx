"use client";
import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Something went wrong.</h1>
      <p className="mt-2 max-w-sm text-[15px] text-ink-3">Nothing you entered has been lost. Try again, and if it keeps happening, let us know.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
