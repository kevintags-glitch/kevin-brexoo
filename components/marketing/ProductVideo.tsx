"use client";
import { useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A short, silent product video: autoplays muted and loops, with a visible play/pause control and a
 * text transcript. Reduced-motion visitors get the poster frame and can press play themselves.
 */
export function ProductVideo({ src, poster, label, transcript, className }: { src: string; poster: string; label: string; transcript: string[]; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(!reduce);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play().then(() => setPlaying(true)).catch(() => {});
    else {
      v.pause();
      setPlaying(false);
    }
  };
  return (
    <figure className={cn("relative", className)}>
      <div className="relative overflow-hidden rounded-[24px] border border-line bg-white shadow-lg">
        <video ref={ref} className="block aspect-video w-full" autoPlay={!reduce} muted loop playsInline preload="metadata" poster={poster} aria-label={label} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
          <source src={`${src}.webm`} type="video/webm" />
          <source src={`${src}.mp4`} type="video/mp4" />
        </video>
        <button type="button" onClick={toggle} aria-label={playing ? "Pause video" : "Play video"} className="pressable absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-[#0f2742]/80 text-white backdrop-blur hover:bg-[#0f2742]">
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </button>
      </div>
      <details className="mt-3 text-[14px] text-ink-3">
        <summary className="cursor-pointer select-none font-medium hover:text-ink">Read what happens in the video</summary>
        <ol className="mt-2 grid list-decimal gap-1 pl-5">
          {transcript.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </details>
    </figure>
  );
}
