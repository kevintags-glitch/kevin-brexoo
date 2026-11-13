"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { answer, type ChatKnowledge } from "@/features/visitor-chat/engine";
import { submitEnquiry } from "@/features/public/actions";
import { Button, Checkbox } from "@/components/ui";
import { cn } from "@/lib/cn";
import { consentText } from "./EnquiryForm";
import type { PublicPageData } from "./types";

type Msg = { from: "bot" | "me"; text: string; source?: string };
type Field = "category" | "description" | "location" | "name" | "contact";

export function VisitorChat({ data, preview }: { data: PublicPageData; preview?: boolean }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "bot",
      text: `Hi! I can answer questions using ${data.business.name}'s page, or help you start an enquiry. I'm an automated assistant, not a person, and chatting here isn't a booking.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [flow, setFlow] = useState<Field | "confirm" | "done" | null>(null);
  const [draft, setDraft] = useState({ category_code: data.services.length === 1 ? data.services[0]!.code : "", description: "", location: "", name: "", email: "", phone: "" });
  const [consent, setConsent] = useState(false);
  const [unanswered, setUnanswered] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef(0);
  // On phones the form is the primary action: keep the chat button out of its way while it's on screen.
  const [formInView, setFormInView] = useState(false);
  useEffect(() => {
    const form = document.getElementById("enquire");
    if (!form) return;
    const io = new IntersectionObserver(([e]) => setFormInView(Boolean(e?.isIntersecting)), { threshold: 0.15 });
    io.observe(form);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const kb: ChatKnowledge = {
    businessName: data.business.name,
    phone: data.business.phone,
    services: data.services,
    areas: data.areas,
    faqs: data.content.faqs.filter((f) => f.q && f.a),
  };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, flow]);
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const say = (...m: Msg[]) => setMsgs((cur) => [...cur, ...m]);
  const prompts: Record<Field, string> = {
    category: "Which service do you need?",
    description: "In a sentence or two, what's the project?",
    location: "Which suburb or area is it in?",
    name: "And your name?",
    contact: "What's the best email or phone number to reach you?",
  };

  const startEnquiry = () => {
    const first: Field = draft.category_code ? "description" : "category";
    say({ from: "bot", text: `Great. I'll ask a few short questions, then show you a summary to confirm before anything is sent. ${prompts[first]}` });
    setFlow(first);
  };

  const advance = (f: Field) => {
    const order: Field[] = ["category", "description", "location", "name", "contact"];
    const nextField = order[order.indexOf(f) + 1];
    if (nextField) {
      setFlow(nextField);
      say({ from: "bot", text: prompts[nextField] });
    } else {
      setFlow("confirm");
      say({ from: "bot", text: "Here's what I'll send. Please check it and confirm." });
    }
  };

  const onSend = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setInput("");
    say({ from: "me", text: t });
    if (flow && flow !== "confirm" && flow !== "done") {
      if (flow === "description") setDraft((d) => ({ ...d, description: t }));
      if (flow === "location") setDraft((d) => ({ ...d, location: t }));
      if (flow === "name") setDraft((d) => ({ ...d, name: t }));
      if (flow === "contact") {
        const isEmail = /@/.test(t);
        if (isEmail ? !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t) : t.replace(/\D/g, "").length < 6) {
          say({ from: "bot", text: "That doesn't look like an email or phone number. Could you check it?" });
          return;
        }
        setDraft((d) => ({ ...d, email: isEmail ? t : d.email, phone: isEmail ? d.phone : t }));
      }
      if (flow === "category") {
        const svc = data.services.find((s) => s.name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(s.name.toLowerCase().split(" ")[0]!));
        if (!svc) {
          say({ from: "bot", text: `Please pick one: ${data.services.map((s) => s.name).join(", ")}.` });
          return;
        }
        setDraft((d) => ({ ...d, category_code: svc.code }));
      }
      advance(flow);
      return;
    }
    const a = answer(t, kb);
    if (a.kind === "unknown") setUnanswered((u) => [...u, t]);
    say({ from: "bot", text: a.text, source: a.kind === "unknown" ? undefined : a.source });
  };

  const confirm = () => {
    if (!consent) return;
    if (preview) {
      say({ from: "bot", text: "This is a preview, so nothing was sent. Once the page is live, enquiries arrive in your Brexoo inbox." });
      setFlow("done");
      return;
    }
    start(async () => {
      const description = draft.description + (unanswered.length ? `\n\nQuestions asked in chat: ${unanswered.join(" | ")}` : "");
      const res = await submitEnquiry(data.slug, {
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        category_code: draft.category_code || undefined,
        description,
        location: draft.location,
        answers: {},
        consent: true,
        consent_text: consentText(data.business.name),
        source: "visitor_chat",
        started_at: startedAt.current,
      });
      if (res.ok) {
        say({ from: "bot", text: `Sent. Your reference is ${res.reference}. ${data.business.name} will be in touch. This isn't a booking; they'll confirm any appointment with you.` });
        setFlow("done");
      } else say({ from: "bot", text: res.error });
    });
  };

  const svcName = data.services.find((s) => s.code === draft.category_code)?.name;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "pressable fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#0f2742] pl-4 pr-5 text-[14px] font-medium text-white shadow-lg transition-[opacity,transform] duration-200",
          open && "pointer-events-none opacity-0",
          formInView && "max-sm:pointer-events-none max-sm:translate-y-4 max-sm:opacity-0",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MessageCircle className="size-5" aria-hidden /> Ask a question
      </button>

      <div
        role="dialog"
        aria-modal="false"
        aria-label={`Chat with ${data.business.name}'s assistant`}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[min(640px,88dvh)] flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-lg sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{data.business.name}</p>
            <p className="text-[12px] text-ink-3">Automated assistant · answers from this page</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-surface-2" aria-label="Close chat">
            <X className="size-5" />
          </button>
        </div>
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed", m.from === "me" ? "rounded-br-md bg-blue text-on-blue" : "rounded-bl-md bg-surface-2 text-ink")}>
                {m.text}
                {m.source ? <p className="mt-1 text-[11px] text-ink-3">Source: {m.source}</p> : null}
              </div>
            </div>
          ))}
          {flow === null ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {["What areas do you cover?", "What services do you offer?", ...(kb.faqs[0] ? [kb.faqs[0].q] : [])].map((q) => (
                <button key={q} type="button" onClick={() => onSend(q)} className="pressable rounded-full border border-line-strong px-3 py-1.5 text-[13px] text-ink-2 hover:bg-surface-2">
                  {q}
                </button>
              ))}
              <button type="button" onClick={startEnquiry} className="pressable rounded-full bg-blue px-3 py-1.5 text-[13px] font-medium text-on-blue">
                Start an enquiry
              </button>
            </div>
          ) : null}
          {flow === "category" ? (
            <div className="flex flex-wrap gap-2">
              {data.services.map((s) => (
                <button key={s.code} type="button" onClick={() => onSend(s.name)} className="pressable rounded-full border border-line-strong px-3 py-1.5 text-[13px] text-ink-2 hover:bg-surface-2">
                  {s.name}
                </button>
              ))}
            </div>
          ) : null}
          {flow === "confirm" ? (
            <div className="rounded-2xl border border-line p-4 text-[14px]">
              <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1.5">
                {svcName ? (
                  <>
                    <dt className="text-ink-3">Service</dt>
                    <dd>{svcName}</dd>
                  </>
                ) : null}
                <dt className="text-ink-3">Project</dt>
                <dd className="break-words">{draft.description}</dd>
                <dt className="text-ink-3">Location</dt>
                <dd>{draft.location}</dd>
                <dt className="text-ink-3">Name</dt>
                <dd>{draft.name}</dd>
                <dt className="text-ink-3">Contact</dt>
                <dd className="break-all">{draft.email || draft.phone}</dd>
              </dl>
              <label className="mt-4 flex gap-3 text-[13px] leading-snug text-ink-2">
                <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>{consentText(data.business.name)}</span>
              </label>
              <Button className="mt-4 w-full" disabled={!consent} pending={pending} onClick={confirm}>
                Send enquiry
              </Button>
            </div>
          ) : null}
        </div>
        <form
          className="flex items-center gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault();
            onSend(input);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <input
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={flow === "confirm" || flow === "done" || flow === "category"}
            placeholder={flow && flow !== "done" && flow !== "confirm" ? "Type your answer" : "Ask a question"}
            className="h-11 min-w-0 flex-1 rounded-xl bg-surface-2 px-3.5 text-[15px] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-blue/30 disabled:opacity-60"
            autoComplete="off"
            maxLength={500}
          />
          <button type="submit" className="pressable grid size-11 place-items-center rounded-xl bg-blue text-on-blue disabled:opacity-50" aria-label="Send" disabled={!input.trim()}>
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </>
  );
}
