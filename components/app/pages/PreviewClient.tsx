"use client";
import { useEffect, useState } from "react";
import { PublicLanding } from "@/components/public/PublicLanding";
import type { PublicPageData } from "@/components/public/types";

/**
 * Renders inside the editor's iframe so the page's responsive layout matches the preview width.
 * The editor posts unsaved edits here; only same-origin messages are accepted.
 */
export function PreviewClient({ initial }: { initial: PublicPageData }) {
  const [data, setData] = useState(initial);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "brexoo-preview") return;
      setData(e.data.data as PublicPageData);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "brexoo-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return <PublicLanding data={data} preview />;
}
