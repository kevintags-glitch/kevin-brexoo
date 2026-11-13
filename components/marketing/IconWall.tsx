import { BRAND_ICON_LABEL, BRAND_ICON_NAMES, BrandIcon } from "./brand-icons";
import { Marquee } from "./motion";

/** Two slow rows of the brand icons drifting in opposite directions; pauses on hover. */
export function IconWall() {
  const half = Math.ceil(BRAND_ICON_NAMES.length / 2);
  const rows = [BRAND_ICON_NAMES.slice(0, half), BRAND_ICON_NAMES.slice(half)];
  return (
    <div className="grid gap-4">
      <ul className="sr-only">
        {BRAND_ICON_NAMES.map((n) => (
          <li key={n}>{BRAND_ICON_LABEL[n]}</li>
        ))}
      </ul>
      {rows.map((row, r) => (
        <Marquee key={r} reverse={r === 1} speed={r ? 90 : 80}>
          {row.map((n) => (
            <span key={n} title={BRAND_ICON_LABEL[n]} className="flex shrink-0 flex-col items-center gap-2 rounded-[22px] border border-line bg-white px-5 py-4">
              <BrandIcon name={n} className="size-12" />
              <span className="type-label text-ink-3">{BRAND_ICON_LABEL[n]}</span>
            </span>
          ))}
        </Marquee>
      ))}
    </div>
  );
}
