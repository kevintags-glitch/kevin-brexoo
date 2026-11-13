"use client";
import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <h1 className="type-subhead">Something went wrong.</h1>
      <p className="type-body mt-2 max-w-sm text-ink-3">Nothing you entered has been lost. Try again, and if it keeps happening, let us know.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
