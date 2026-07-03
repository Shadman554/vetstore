import { Link, useLocation } from "wouter";
import { Home, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/lib/use-site-settings";

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const { t } = useI18n();
  const { settings } = useSiteSettings();

  const handleSearchTab = () => {
    setLocation("/");
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>("[data-testid='mobile-input-search']");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const tabs = [
    {
      type: "link" as const,
      href: "/",
      icon: Home,
      label: t("nav.catalog"),
      testId: "mobile-tab-home",
      active: location === "/",
    },
    {
      type: "button" as const,
      icon: Search,
      label: t("catalog.search").split("…")[0].split("...")[0].trim() || "Search",
      testId: "mobile-tab-search",
      active: false,
      onClick: handleSearchTab,
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

          if (tab.type === "button") {
            return (
              <button
                key={tab.testId}
                onClick={tab.onClick}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
                data-testid={tab.testId}
              >
                {content}
              </button>
            );
          }

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
