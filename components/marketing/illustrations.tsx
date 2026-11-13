/**
 * Spot illustrations, now drawn from the logo-style brand icon set (brand-icons.tsx). Kept as a thin
 * mapping so existing call sites (menus, tabs, feature and trade cards) use the new drawings.
 */
import { BrandIcon, type BrandIconName } from "./brand-icons";

export type IllustrationName = "house" | "bolt" | "tap" | "fan" | "hammer" | "leaf" | "spray" | "roof" | "calendar" | "magnifier" | "spark" | "chat" | "chart" | "shield";

const MAP: Record<IllustrationName, BrandIconName> = {
  house: "home", bolt: "bolt", tap: "tap", fan: "ac", hammer: "hammer", leaf: "leaf", spray: "spray", roof: "roof",
  calendar: "calendar", magnifier: "discover", spark: "spark", chat: "chat", chart: "report", shield: "shield",
};

export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  return <BrandIcon name={MAP[name]} className={className} />;
}
