"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SUPPORT_SUGGESTIONS, supportAnswer, type SupportLink } from "@/features/support/answer";
import { LogoMark } from "@/components/brand/Logo";
import { LoopGlyph, MarkOutline } from "@/components/brand/BrandMotif";
import { BrandIcon, type BrandIconName } from "./brand-icons";

type Msg = { from: "user" | "bot"; text: string; links?: SupportLink[] };

/** Starter questions, each shown as a card with its brand icon. */
const TOPIC_ICON: Record<string, BrandIconName> = {
  "What is Brexoo?": "brand",
  "How much does it cost?": "money",
  "Which countries?": "mappin",
  "Will you email my customers?": "email",
};

/** The Brexoo mark on a Cloud White tile: the assistant's avatar. */
function BotAvatar() {
  return (
    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[30%] bg-[#E6F4FF]">
      <LogoMark className="size-4" color="#02336A" />
    </span>
  );
}

const GREETING: Msg = {
  from: "bot",
  text: "Hi! Ask me anything about Brexoo: features, pricing, industries or where we launch.",
};

/** Floating support chat for the website. Answers come only from approved Brexoo content. */
export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [msgs, typing, reduce]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function ask(q: string) {
    const question = q.trim();
    if (!question || typing) return;
    setMsgs((m) => [...m, { from: "user", text: question }]);
    setText("");
    setTyping(true);
    const reply = supportAnswer(question);
    window.setTimeout(
      () => {
        setMsgs((m) => [...m, { from: "bot", text: reply.text, links: reply.links }]);
        setTyping(false);
      },
      reduce ? 0 : 550,
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(text);
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label="Brexoo help chat"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-[70] flex h-[min(560px,calc(100dvh-8rem-env(safe-area-inset-bottom)))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_24px_60px_-12px_rgb(15_39_66/0.28)] sm:right-6"
          >
            <div className="relative flex items-center gap-3 overflow-hidden bg-[#0F2742] px-5 py-4 text-white">
              <MarkOutline className="absolute -right-6 -top-10 h-36 text-white/[0.07]" strokeWidth={40} />
              <span className="relative grid size-11 place-items-center rounded-[30%] bg-white/10 ring-1 ring-white/15">
                <LogoMark className="size-6" color="#ffffff" />
                <span aria-hidden className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#0F2742] bg-[#06B6D4]" />
              </span>
              <div className="relative flex-1">
                <p className="flex items-center gap-2 text-[15px] font-medium">
                  Brexoo help <LoopGlyph className="h-3" />
                </p>
                <p className="text-[12px] text-white/65">Answers from Brexoo&apos;s own guides</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                aria-label="Close chat"
                className="relative grid size-9 place-items-center rounded-full hover:bg-white/10"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div aria-hidden className="h-1 bg-[linear-gradient(90deg,#0F2742,#3B82F6_50%,#06B6D4)]" />
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
              {msgs.map((m, i) =>
                m.from === "user" ? (
                  <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#3B82F6] px-4 py-2.5 text-[14px] leading-relaxed text-white">
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="flex max-w-[92%] items-end gap-2">
                    <BotAvatar />
                    <div className="rounded-2xl rounded-bl-md border border-[#D6EBFF] bg-[#F3F9FF] px-4 py-2.5 text-[14px] leading-relaxed text-[#0F2742]">
                      {m.text}
                      {m.links?.length ? (
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {m.links.map((l) => (
                            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-full border border-[#3B82F6]/30 bg-white px-3 py-1 text-[12px] font-medium text-[#2F6FE4] hover:bg-[#0F2742] hover:text-white">
                              {l.label}
                            </Link>
                          ))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
              {typing ? (
                <div className="flex items-end gap-2">
                  <BotAvatar />
                  <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md border border-[#D6EBFF] bg-[#F3F9FF] px-4 py-3" aria-label="Typing">
                    {["#0F2742", "#3B82F6", "#06B6D4"].map((c, d) => (
                      <span key={c} className="size-1.5 rounded-full motion-safe:animate-bounce" style={{ background: c, animationDelay: `${d * 120}ms` }} />
                    ))}
                  </div>
                </div>
              ) : null}
              {msgs.length === 1 ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {SUPPORT_SUGGESTIONS.map((s, k) => (
                    <button key={s} type="button" onClick={() => ask(s)} className="group flex flex-col items-start gap-2.5 rounded-2xl border border-line bg-white p-3 text-left text-[13px] font-medium leading-snug text-[#0F2742] transition-[border-color,box-shadow] hover:border-[#3B82F6]/50 hover:shadow-sm">
                      <BrandIcon name={TOPIC_ICON[s] ?? "chat"} tone={(["navy", "blue", "teal", "cloud"] as const)[k % 4]} className="size-9 transition-transform duration-300 group-hover:-translate-y-0.5" />
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3">
              <label htmlFor="support-q" className="sr-only">
                Your question
              </label>
              <input
                ref={inputRef}
                id="support-q"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about Brexoo…"
                maxLength={300}
                autoComplete="off"
                className="h-11 flex-1 rounded-full border border-line bg-[#F3F9FF] px-4 text-[14px] text-[#0F2742] outline-none placeholder:text-ink-3 focus:border-[#3B82F6]"
              />
              <button type="submit" aria-label="Send" disabled={!text.trim() || typing} className="pressable grid size-11 place-items-center rounded-[30%] bg-[#0F2742] text-white transition-colors hover:bg-[#3B82F6] disabled:opacity-40">
                <ArrowUp className="size-4" aria-hidden />
              </button>
            </form>
            <p className="px-4 pb-3 text-center text-[11px] text-ink-3">
              Answers come from our guides. For anything important, <Link href="/demo" className="underline hover:text-blue" onClick={() => setOpen(false)}>talk to our team</Link>.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close help chat" : "Chat with Brexoo"}
        className="pressable fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-[70] grid size-14 place-items-center rounded-[30%] bg-[#0F2742] text-white shadow-[0_14px_32px_-8px_rgb(15_39_66/0.55)] ring-1 ring-white/10 transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#183A60] sm:right-6"
      >
        <span aria-hidden className="absolute inset-0 rounded-[30%] bg-[#06B6D4]/35 motion-safe:animate-ping [animation-duration:2.8s]" hidden={open} />
        <AnimatePresence initial={false} mode="wait">
          <motion.span key={open ? "x" : "mark"} initial={{ rotate: -90, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.6 }} transition={{ duration: 0.18 }} className="relative">
            {open ? <X className="size-6" aria-hidden /> : <LogoMark className="size-7" color="#ffffff" />}
          </motion.span>
        </AnimatePresence>
        {open ? null : <span aria-hidden className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-white bg-[#06B6D4]" />}
      </button>
    </>
  );
}
