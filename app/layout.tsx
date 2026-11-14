import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Brexoo — Find, qualify and win local projects", template: "%s · Brexoo" },
  description:
    "Find project leads. Qualify opportunities. Book more jobs. Project enquiries, AI-assisted qualification and follow-up for builders, trades and home service businesses.",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Brexoo", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: { siteName: "Brexoo", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Matches the navy menu bar, so the phone's browser bar blends into it.
  themeColor: "#0F2742",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
