"use client";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Two cuts of the same film: 16:9 for wide screens and 9:16 for phones held upright. */
export const STAIRS_FILM = {
  wide: { mp4: "/media/brexoo-stairs.mp4", webm: "/media/brexoo-stairs.webm", poster: "/media/brexoo-stairs-poster.jpg" },
  tall: { mp4: "/media/brexoo-stairs-tall.mp4", webm: "/media/brexoo-stairs-tall.webm", poster: "/media/brexoo-stairs-tall-poster.jpg" },
};

/** The steps the brand shapes hop across in the film, also given to screen readers as text. */
export const STAIR_STEPS = [
  ["Discover", "Find projects"],
  ["Qualify", "Check the fit"],
  ["Engage", "Follow up fast"],
  ["Book", "Site visits"],
  ["Win", "Grow revenue"],
] as const;

const TALL_QUERY = "(max-aspect-ratio: 4/5)";

/**
 * The first screen: a full-bleed film in which the two logo shapes hop up five brick steps, one
 * Brexoo service per step, then come together as the Brexoo logo. It plays by itself (muted,
 * looping, inline) and fills the area it's given; a small control can pause it.
 */
export function StairsFilm({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [cut, setCut] = useState<"wide" | "tall" | null>(null);
  const [playing, setPlaying] = useState(true);

  // Pick the cut that matches the screen shape, and switch if the phone is rotated.
  useEffect(() => {
    const mq = window.matchMedia(TALL_QUERY);
    const pick = () => setCut(mq.matches ? "tall" : "wide");
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  // Start playback as soon as the chosen cut is in place (some browsers ignore the autoplay
  // attribute on elements added after load, so ask explicitly as well).
  useEffect(() => {
    const v = ref.current;
    if (!v || !cut) return;
    v.muted = true;
    v.load();
    v.play().catch(() => setPlaying(false));
  }, [cut]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const film = STAIRS_FILM[cut ?? "wide"];

  return (
    <div className={cn("overflow-hidden bg-white", className ?? "relative")}>
      {/* Before the cut is chosen, show the matching still so there's no flash or layout jump. */}
      <picture>
        <source media={TALL_QUERY} srcSet={STAIRS_FILM.tall.poster} />
        <img src={STAIRS_FILM.wide.poster} alt="" aria-hidden className="absolute inset-0 size-full object-contain" />
      </picture>
      {cut ? (
        <video
          key={cut}
          ref={ref}
          className="absolute inset-0 size-full object-contain"
          poster={film.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={film.mp4} type="video/mp4" />
          <source src={film.webm} type="video/webm" />
        </video>
      ) : null}
      <p className="sr-only">
        Animation: the Brexoo shapes climb five steps, {STAIR_STEPS.map(([w, s]) => `${w} (${s.toLowerCase()})`).join(", ")}, and form the Brexoo logo.
      </p>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause animation" : "Play animation"}
        className="absolute bottom-4 left-4 grid size-9 place-items-center rounded-full border border-line bg-white/80 text-ink-2 shadow-xs backdrop-blur transition-colors hover:text-ink sm:bottom-6 sm:left-6"
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
      </button>
    </div>
  );
}
