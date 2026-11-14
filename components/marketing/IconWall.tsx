import { BRAND_ICON_LABEL, BRAND_ICON_NAMES, BrandIcon, TONE_CYCLE } from "./brand-icons";
import { Marquee } from "./motion";

/** Two slow rows of the brand icons drifting in opposite directions; pauses on hover. */
export function IconWall() {
  const third = Math.ceil(BRAND_ICON_NAMES.length / 3);
  const rows = [BRAND_ICON_NAMES.slice(0, third), BRAND_ICON_NAMES.slice(third, third * 2), BRAND_ICON_NAMES.slice(third * 2)];
  return (
    <div className="grid gap-4">
      <ul className="sr-only">
        {BRAND_ICON_NAMES.map((n) => (
          <li key={n}>{BRAND_ICON_LABEL[n]}</li>
        ))}
      </ul>
      {rows.map((row, r) => (
        <Marquee key={r} reverse={r === 1} speed={95 + r * 10}>
          {row.map((n, k) => (
            <span key={n} title={BRAND_ICON_LABEL[n]} className="flex w-[124px] shrink-0 flex-col items-center gap-3 rounded-[24px] border border-line bg-white px-4 py-5">
              <BrandIcon name={n} tone={TONE_CYCLE[(k + r) % TONE_CYCLE.length]} className="size-14" />
              <span className="type-label text-ink-3">{BRAND_ICON_LABEL[n]}</span>
            </span>
          ))}
        </Marquee>
      ))}
    </div>
  );
}
