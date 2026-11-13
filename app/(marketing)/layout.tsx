import { MotionProvider } from "@/components/marketing/MotionProvider";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SupportChat } from "@/components/marketing/SupportChat";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <SiteHeader />
      <main id="main" className="overflow-x-clip">{children}</main>
      <SiteFooter />
      <SupportChat />
    </MotionProvider>
  );
}
