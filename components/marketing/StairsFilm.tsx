"use client";
import { useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export const STAIRS_FILM = {
  webm: "/media/brexoo-stairs.webm",
  mp4: "/media/brexoo-stairs.mp4",
  poster: "/media/brexoo-stairs-poster.jpg",
};

/** The steps the brand shapes hop across in the film, also given to screen readers as text. */
export const STAIR_STEPS = [
  ["Discover", "Find projects"],
  ["Qualify", "Check the fit"],
  ["Engage", "Follow up fast"],
  ["Book", "Site visits"],
  ["Win", "Grow revenue"],
] as const;

/**
 * The first screen: a short film in which the two logo shapes hop up five brick steps, one Brexoo
 * service per step, then come together as the Brexoo logo. Muted and looping; it never autoplays
 * for people who prefer reduced motion, and a pause control is always available.
 */
export function StairsFilm({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduce) {
      v.pause();
      return;
    }
    v.play().catch(() => setPlaying(false));
  }, [reduce]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  return (
    <div className={cn("relative", className)}>
      <video
        ref={ref}
        className="block aspect-[5/4] w-full object-cover sm:aspect-video sm:object-contain"
        poster={STAIRS_FILM.poster}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={STAIRS_FILM.webm} type="video/webm" />
        <source src={STAIRS_FILM.mp4} type="video/mp4" />
      </video>
      <p className="sr-only">
        Animation: the Brexoo shapes climb five steps, {STAIR_STEPS.map(([w, s]) => `${w} (${s.toLowerCase()})`).join(", ")}, and form the Brexoo logo.
      </p>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause animation" : "Play animation"}
        className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full border border-line bg-white/80 text-ink-2 shadow-xs backdrop-blur transition-colors hover:text-ink sm:bottom-5 sm:right-5"
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
      </button>
    </div>
  );
}
