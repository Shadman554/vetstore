import { Link } from "wouter";
import { Moon, Sun, ShoppingCart, Stethoscope } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Language } from "@/lib/i18n-core";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FlagEN from "@assets/image_1782038673428.png";
import FlagAR from "@assets/image_1782038640101.png";
import FlagKU from "@assets/image_1782038656177.png";
import { useSecretTap } from "@/hooks/use-secret-tap";
import { useSiteSettings } from "@/lib/use-site-settings";
import { useCart } from "@/lib/cart";
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

export function MobileHeader() {
  const { lang, setLang, isRtl } = useI18n();
  const { theme, setTheme } = useTheme();
  const handleSecretTap = useSecretTap();
  const { settings } = useSiteSettings();
  const { itemCount } = useCart();

  return (
    <header
      className="md:hidden sticky top-0 z-50 bg-white dark:bg-card flex items-center justify-between px-4 h-14"
      style={{ borderBottom: `4px solid ${settings.color1}` }}
    >
      <Link href="/" className="flex items-center gap-1.5" data-testid="mobile-link-home" onClick={handleSecretTap}>
        <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: settings.color1 }}>
          <Stethoscope className="h-4 w-4 text-white" />
        </span>
        <span className="font-display font-extrabold text-base tracking-tight" style={{ color: settings.color1 }}>{SITE_NAME}</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link href="/cart" data-testid="mobile-link-cart" className="relative">
          <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold text-white"
                style={{ background: settings.color2 }}
              >
                {itemCount}
              </span>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 flex items-center justify-center" data-testid="mobile-btn-lang">
              <FlagIcon lang={lang} size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRtl ? "start" : "end"} className="rounded-2xl font-sans font-semibold border-2">
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
          data-testid="mobile-btn-theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: settings.color1 }} />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: settings.color2 }} />
        </Button>
      </div>
    </header>
  );
}
