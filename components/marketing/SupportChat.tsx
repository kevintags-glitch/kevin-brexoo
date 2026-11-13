"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MessageCircle, SendHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SUPPORT_SUGGESTIONS, supportAnswer, type SupportLink } from "@/features/support/answer";
import { cn } from "@/lib/cn";

type Msg = { from: "user" | "ai"; text: string; links?: SupportLink[] };

const GREETING: Msg = {
  from: "ai",
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
        setMsgs((m) => [...m, { from: "ai", text: reply.text, links: reply.links }]);
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
            className="fixed bottom-24 right-4 z-[70] flex h-[min(560px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_24px_60px_-12px_rgb(15_39_66/0.28)] sm:right-6"
          >
            <div className="flex items-center gap-3 bg-[#0f2742] px-5 py-4 text-white">
              <span className="grid size-9 place-items-center rounded-xl bg-white/10">
                <Sparkles className="size-4 text-[#5fd4ea]" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-medium">Brexoo help</p>
                <p className="text-[12px] text-white/60">Answers from Brexoo&apos;s own guides</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                aria-label="Close chat"
                className="grid size-9 place-items-center rounded-full hover:bg-white/10"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
              {msgs.map((m, i) => (
                <div key={i} className={cn("max-w-[88%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed", m.from === "user" ? "ml-auto rounded-br-md bg-blue text-white" : "rounded-bl-md bg-surface-2 text-ink-2")}>
                  {m.text}
                  {m.links?.length ? (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-full border border-blue/30 bg-white px-3 py-1 text-[12px] font-medium text-blue hover:bg-blue hover:text-white">
                          {l.label}
                        </Link>
                      ))}
                    </span>
                  ) : null}
                </div>
              ))}
              {typing ? (
                <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3" aria-label="Typing">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-1.5 rounded-full bg-ink-3 motion-safe:animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </div>
              ) : null}
              {msgs.length === 1 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUPPORT_SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-line px-3 py-1.5 text-[12px] text-ink-2 hover:border-blue/40 hover:text-blue">
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
                className="h-11 flex-1 rounded-full border border-line bg-surface-2/60 px-4 text-[14px] outline-none focus:border-blue"
              />
              <button type="submit" aria-label="Send" disabled={!text.trim() || typing} className="pressable grid size-11 place-items-center rounded-full bg-blue text-white disabled:opacity-40">
                <SendHorizontal className="size-4" aria-hidden />
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
        className="pressable fixed bottom-5 right-4 z-[70] grid size-14 place-items-center rounded-full bg-blue text-white shadow-[0_12px_30px_-6px_rgb(47_111_228/0.6)] transition-colors hover:bg-blue-hover sm:right-6"
      >
        <span aria-hidden className="absolute inset-0 rounded-full bg-blue/40 motion-safe:animate-ping [animation-duration:2.6s]" hidden={open} />
        <AnimatePresence initial={false} mode="wait">
          <motion.span key={open ? "x" : "chat"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} className="relative">
            {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
          </motion.span>
        </AnimatePresence>
      </button>
    </>
  );
}
