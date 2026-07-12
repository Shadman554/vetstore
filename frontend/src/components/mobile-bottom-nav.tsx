import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, Store, User } from "lucide-react";
import { useSiteSettings } from "@/lib/use-site-settings";

export function MobileBottomNav() {
  const [location] = useLocation();
  const { settings } = useSiteSettings();

  const tabs = [
    {
      type: "link" as const,
      href: "/",
      icon: Home,
      label: "Home",
      testId: "mobile-tab-home",
      active: location === "/",
    },
    {
      type: "link" as const,
      href: "/shop",
      icon: ShoppingBag,
      label: "Shop",
      testId: "mobile-tab-shop",
      active: location === "/shop",
    },
    {
      type: "link" as const,
      href: "/vendors",
      icon: Store,
      label: "Stores",
      testId: "mobile-tab-vendors",
      active: location === "/vendors",
    },
    {
      type: "link" as const,
      href: "/account",
      icon: User,
      label: "Account",
      testId: "mobile-tab-account",
      active: location === "/account",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t-2 border-border">
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const content = (
            <>
              {tab.active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-b-full"
                  style={{ background: settings.color1 }}
                />
              )}
              <Icon
                className="h-5 w-5 transition-colors"
                style={{ color: tab.active ? settings.color3 : "#94a3b8" }}
                strokeWidth={tab.active ? 2.5 : 1.8}
              />
              <span
                className="text-[10px] font-display font-bold tracking-wide transition-colors"
                style={{ color: tab.active ? settings.color3 : "#94a3b8" }}
              >
                {tab.label}
              </span>
            </>
          );

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
              data-testid={tab.testId}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
