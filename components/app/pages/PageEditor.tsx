"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ExternalLink, Monitor, Plus, Smartphone, Trash } from "lucide-react";
import { approvePage, publishPage, saveDraft, setPagePaused, submitPage, type PageActionState } from "@/features/landing-pages/actions";
import type { PageContent } from "@/features/landing-pages/content";
import type { PublicPageData } from "@/components/public/types";
import { Badge, Button, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { PAGE_STATUS } from "@/features/landing-pages/status";
import { cn } from "@/lib/cn";


export function PageEditor({
  page,
  base,
  isOwner,
  liveUrl,
  flags,
}: {
  page: { id: string; title: string; slug: string; status: string; draft: PageContent };
  flags: { draftDiffers: boolean; awaitingApproval: boolean; readyToPublish: boolean };
  base: Omit<PublicPageData, "content" | "slug" | "title" | "page_id">;
  isOwner: boolean;
  liveUrl: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState<PageContent>(page.draft);
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [dirty, setDirty] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [state, setState] = useState<PageActionState>({});
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const update = (patch: Partial<PageContent>) => {
    setContent((c) => ({ ...c, ...patch }));
    setDirty(true);
  };

  const act = (label: string, fn: () => Promise<PageActionState>) => {
    setBusy(label);
    start(async () => {
      const r = await fn();
      setState(r);
      setBusy(null);
      if (r.ok) {
        setDirty(false);
        router.refresh();
      }
    });
  };
  const save = () => act("save", () => saveDraft(page.id, content, { title, slug }));
  const saveThen = (label: string, fn: () => Promise<PageActionState>) =>
    act(label, async () => {
      if (dirty) {
        const r = await saveDraft(page.id, content, { title, slug });
        if (!r.ok) return r;
      }
      return fn();
    });

  const preview: PublicPageData = useMemo(() => ({ ...base, page_id: page.id, slug, title, content }), [base, page.id, slug, title, content]);
  const status = PAGE_STATUS[page.status] ?? PAGE_STATUS.draft!;
  const fe = state.fieldErrors ?? {};

  return (
    <div className="grid gap-6">
      {/* Workflow bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          <p className="text-[13px] text-ink-3">
            {dirty ? "Unsaved changes." : status.help}
            {page.status === "published" && !dirty && (flags.draftDiffers || flags.awaitingApproval || flags.readyToPublish) ? " There are changes that aren't live yet." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {page.status === "published" || page.status === "paused" ? (
            <a href={liveUrl} target="_blank" rel="noreferrer" className="pressable inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2">
              View live <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
          <Button variant="secondary" size="sm" onClick={save} pending={busy === "save"} disabled={!dirty || pending}>
            Save draft
          </Button>
          {(page.status === "draft" || ((page.status === "published" || page.status === "paused") && (flags.draftDiffers || dirty))) && (
            <Button size="sm" onClick={() => saveThen("submit", () => submitPage(page.id))} pending={busy === "submit"} disabled={pending}>
              {page.status === "draft" ? "Submit for approval" : "Submit changes"}
            </Button>
          )}
          {page.status === "awaiting_approval" || (page.status === "published" && flags.awaitingApproval && !flags.draftDiffers && !dirty) ? (
            <Button size="sm" onClick={() => act("approve", () => approvePage(page.id))} pending={busy === "approve"} disabled={!isOwner || pending || dirty} title={isOwner ? undefined : "Only an owner can approve"}>
              Approve version
            </Button>
          ) : null}
          {page.status === "approved" || (page.status === "published" && flags.readyToPublish && !flags.draftDiffers && !dirty) ? (
            <Button size="sm" onClick={() => act("publish", () => publishPage(page.id))} pending={busy === "publish"} disabled={!isOwner || pending} title={isOwner ? undefined : "Only an owner can publish"}>
              Publish
            </Button>
          ) : null}
          {page.status === "published" ? (
            <Button variant="secondary" size="sm" onClick={() => act("pause", () => setPagePaused(page.id, true))} pending={busy === "pause"} disabled={!isOwner || pending}>
              Pause
            </Button>
          ) : null}
          {page.status === "paused" ? (
            <Button size="sm" onClick={() => act("resume", () => setPagePaused(page.id, false))} pending={busy === "resume"} disabled={!isOwner || pending}>
              Resume
            </Button>
          ) : null}
        </div>
      </div>
      {state.error ? <Notice tone="red">{state.error}</Notice> : null}
      {!isOwner ? <Notice tone="blue">You can edit and submit drafts. An owner approves and publishes.</Notice> : null}

      <div className="flex rounded-xl bg-surface-2 p-1 lg:hidden" role="tablist" aria-label="Editor view">
        {(["edit", "preview"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("flex-1 rounded-lg py-2 text-[14px] capitalize", tab === t ? "bg-surface font-medium shadow-xs" : "text-ink-3")}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* Form */}
        <div className={cn("grid content-start gap-5", tab === "preview" && "max-lg:hidden")}>
          <Section title="Page">
            <Field label="Internal name" htmlFor="title">
              <Input id="title" value={title} onChange={(e) => (setTitle(e.target.value), setDirty(true))} />
            </Field>
            <Field label="Address" htmlFor="slug" error={fe.slug} hint={`${liveUrl.replace(/\/p\/.*$/, "")}/p/${slug}`}>
              <Input id="slug" value={slug} onChange={(e) => (setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")), setDirty(true))} />
            </Field>
            <Field label="Colour" htmlFor="accent">
              <Select id="accent" value={content.accent} onChange={(e) => update({ accent: e.target.value as PageContent["accent"] })}>
                <option value="blue">Blue</option>
                <option value="teal">Teal</option>
                <option value="navy">Navy</option>
              </Select>
            </Field>
          </Section>
          <Section title="Hero">
            <Field label="Headline" htmlFor="headline" error={fe.headline}>
              <Input id="headline" value={content.headline} maxLength={110} onChange={(e) => update({ headline: e.target.value })} />
            </Field>
            <Field label="Supporting line" htmlFor="subheadline">
              <Textarea id="subheadline" rows={2} value={content.subheadline} maxLength={240} onChange={(e) => update({ subheadline: e.target.value })} />
            </Field>
            {content.highlights.map((h, i) => (
              <Field key={i} label={`Highlight ${i + 1}`} htmlFor={`hl-${i}`}>
                <Input id={`hl-${i}`} value={h} maxLength={80} onChange={(e) => update({ highlights: content.highlights.map((x, j) => (j === i ? e.target.value : x)) })} />
              </Field>
            ))}
            <Field label="Button label" htmlFor="cta">
              <Input id="cta" value={content.cta} maxLength={40} onChange={(e) => update({ cta: e.target.value })} />
            </Field>
            <Field label="Form introduction" htmlFor="formIntro">
              <Input id="formIntro" value={content.formIntro} maxLength={240} onChange={(e) => update({ formIntro: e.target.value })} />
            </Field>
          </Section>
          <Section title="About">
            <Field label="About your business" htmlFor="about">
              <Textarea id="about" rows={5} value={content.about} maxLength={1200} onChange={(e) => update({ about: e.target.value })} />
            </Field>
          </Section>
          <Section title="How it works">
            {content.process.map((p, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-line p-3">
                <Input aria-label={`Step ${i + 1} title`} value={p.title} maxLength={60} onChange={(e) => update({ process: content.process.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <Textarea aria-label={`Step ${i + 1} description`} rows={2} value={p.body} maxLength={240} onChange={(e) => update({ process: content.process.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
              </div>
            ))}
          </Section>
          <Section
            title="FAQs"
            hint="The chat assistant answers only from these, your services and your areas."
            action={
              content.faqs.length < 10 ? (
                <Button variant="ghost" size="sm" onClick={() => update({ faqs: [...content.faqs, { q: "", a: "" }] })}>
                  <Plus className="size-4" aria-hidden /> Add
                </Button>
              ) : null
            }
          >
            {content.faqs.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-line p-3">
                <div className="flex gap-2">
                  <Input aria-label={`Question ${i + 1}`} placeholder="Question" value={f.q} maxLength={160} onChange={(e) => update({ faqs: content.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} />
                  <Button variant="ghost" className="w-10 shrink-0 px-0" aria-label={`Remove question ${i + 1}`} onClick={() => update({ faqs: content.faqs.filter((_, j) => j !== i) })}>
                    <Trash className="size-4" />
                  </Button>
                </div>
                <Textarea aria-label={`Answer ${i + 1}`} placeholder="Answer" rows={2} value={f.a} maxLength={600} onChange={(e) => update({ faqs: content.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} />
              </div>
            ))}
          </Section>
          <Section title="Assistant">
            <label className="flex items-center justify-between gap-4 text-[14px]">
              <span>
                Show the chat assistant
                <span className="block text-[12px] text-ink-3">Answers from approved content; never books or quotes.</span>
              </span>
              <input type="checkbox" role="switch" checked={content.chatEnabled} onChange={(e) => update({ chatEnabled: e.target.checked })} className="size-5 accent-[var(--blue)]" />
            </label>
          </Section>
        </div>

        {/* Preview */}
        <div className={cn("min-w-0", tab === "edit" && "max-lg:hidden")}>
          <div className="sticky top-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-medium text-ink-3">Preview</p>
              <div className="inline-flex rounded-lg bg-surface-2 p-0.5" role="group" aria-label="Preview size">
                <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} className={cn("grid size-8 place-items-center rounded-md", device === "mobile" ? "bg-surface shadow-xs" : "text-ink-3")} aria-label="Phone">
                  <Smartphone className="size-4" />
                </button>
                <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} className={cn("grid size-8 place-items-center rounded-md", device === "desktop" ? "bg-surface shadow-xs" : "text-ink-3")} aria-label="Desktop">
                  <Monitor className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid place-items-center rounded-2xl border border-line bg-surface-2/60 p-4">
              <PreviewFrame device={device} pageId={page.id} data={preview} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-[15px] font-semibold tracking-normal">{title}</h2>
          {hint ? <p className="mt-0.5 text-[12px] text-ink-3">{hint}</p> : null}
        </div>
        {action}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

/**
 * The preview is an iframe so the page's own media queries see the preview width (a phone layout
 * at 390px, desktop at 1200px). Unsaved edits are posted into it as you type.
 */
function PreviewFrame({ device, pageId, data }: { device: "mobile" | "desktop"; pageId: string; data: PublicPageData }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const width = device === "mobile" ? 390 : 1200;
  const scale = device === "mobile" ? 0.86 : 0.5;
  const height = device === "mobile" ? 660 : 560;
  const post = useCallback(() => {
    ref.current?.contentWindow?.postMessage({ type: "brexoo-preview", data }, window.location.origin);
  }, [data]);
  useEffect(() => {
    post();
    const onReady = (e: MessageEvent) => e.origin === window.location.origin && e.data?.type === "brexoo-preview-ready" && post();
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [post]);
  return (
    <div style={{ width: width * scale, height }} className="overflow-hidden rounded-[18px] bg-white shadow-md ring-1 ring-line">
      <iframe
        ref={ref}
        src={`/app/preview/${pageId}`}
        title="Page preview"
        onLoad={post}
        style={{ width, height: height / scale, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        className="block border-0"
      />
    </div>
  );
}
