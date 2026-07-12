import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import type { Language } from "@/lib/i18n-core";
import { Button } from "@/components/ui/button";
import { Moon, Sun, ShoppingCart, User, Store, Stethoscope } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import FlagEN from "@assets/image_1782038673428.png";
import FlagAR from "@assets/image_1782038640101.png";
import FlagKU from "@assets/image_1782038656177.png";
import { useSecretTap } from "@/hooks/use-secret-tap";
import { useSiteSettings } from "@/lib/use-site-settings";
import { useCart } from "@/lib/cart";
import { isCustomerLoggedIn } from "@/lib/customer-auth";
import { SITE_NAME } from "@/lib/config";

const FLAG_SRC: Record<Language, string> = { EN: FlagEN, AR: FlagAR, KU: FlagKU };

function FlagIcon({ lang, size = 20 }: { lang: Language; size?: number }) {
  const w = Math.round(size * 1.5);
  return (
    <img
      src={FLAG_SRC[lang]}
      alt={lang}
      width={w}
      height={size}
      style={{ borderRadius: 3, objectFit: "cover", display: "inline-block", verticalAlign: "middle" }}
    />
  );
}

export function Navbar() {
  const { lang, setLang, t, isRtl } = useI18n();
  const { theme, setTheme } = useTheme();
  const handleSecretTap = useSecretTap();
  const { settings } = useSiteSettings();
  const { itemCount } = useCart();
  const [location] = useLocation();

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/vendors", label: "Stores" },
  ];

  return (
    <nav
      className="hidden md:block sticky top-0 z-50 w-full bg-white dark:bg-card shadow-md"
      style={{ borderBottom: `4px solid ${settings.color1}` }}
    >
      <div className="container mx-auto flex h-18 items-center px-4 md:px-6 py-2 gap-6">
        <div className={`flex items-center ${isRtl ? 'ml-auto' : 'mr-auto'}`}>
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" data-testid="link-home" onClick={handleSecretTap}>
            <span className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: settings.color1 }}>
              <Stethoscope className="h-5 w-5 text-white" />
            </span>
            <span className="font-display font-extrabold text-xl tracking-tight" style={{ color: settings.color1 }}>{SITE_NAME}</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover-elevate ${location === link.href ? "" : "text-muted-foreground"}`}
              style={location === link.href ? { color: settings.color1 } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className={`flex items-center gap-2 md:gap-3 ${isRtl ? 'mr-auto' : 'ml-auto'}`}>
          <Link href="/vendors/login" className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover-elevate px-3 py-2 rounded-lg" data-testid="link-vendor-portal">
            <Store className="h-4 w-4" />
            Sell on {SITE_NAME}
          </Link>

          <Link href="/account" data-testid="link-account">
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
              <User className="h-5 w-5" style={{ color: isCustomerLoggedIn() ? settings.color1 : undefined }} />
              <span className="sr-only">Account</span>
            </Button>
          </Link>

          <Link href="/cart" data-testid="link-cart" className="relative">
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
                  style={{ background: settings.color2 }}
                >
                  {itemCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 flex items-center justify-center" style={{ ["--tw-ring-color" as string]: settings.color3 }} data-testid="btn-lang-switcher">
                <FlagIcon lang={lang} size={20} />
                <span className="sr-only">Language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl font-sans font-semibold border-2">
              <DropdownMenuItem onClick={() => setLang("KU")} className={`rounded-xl flex items-center gap-2 ${lang === "KU" ? "font-bold" : ""}`} style={lang === "KU" ? { background: `${settings.color3}33` } : {}}>
                <FlagIcon lang="KU" size={18} /> کوردی
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("EN")} className={`rounded-xl flex items-center gap-2 ${lang === "EN" ? "font-bold" : ""}`} style={lang === "EN" ? { background: `${settings.color1}33` } : {}}>
                <FlagIcon lang="EN" size={18} /> English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("AR")} className={`rounded-xl flex items-center gap-2 ${lang === "AR" ? "font-bold" : ""}`} style={lang === "AR" ? { background: `${settings.color2}33` } : {}}>
                <FlagIcon lang="AR" size={18} /> العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            data-testid="btn-theme-toggle"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: settings.color1 }} />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: settings.color2 }} />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
