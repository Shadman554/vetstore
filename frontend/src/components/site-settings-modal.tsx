import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteSettings } from "@/lib/use-site-settings";
import { FONT_PRESETS, FontPreset } from "@/lib/site-settings";
import { useI18n } from "@/lib/i18n";
import { getDefaultTranslation, Language } from "@/lib/i18n-core";
import { RotateCcw, Eye, EyeOff, Check, LogOut } from "lucide-react";
import { changeAdminPin, fetchLoginLogs } from "@/lib/api";
import type { LoginLog } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TEXT_SECTIONS = [
  {
    title: "Homepage",
    keys: [
      { key: "catalog.tagline1", label: "Main Tagline" },
      { key: "catalog.tagline2", label: "Sub Tagline" },
      { key: "catalog.search", label: "Search Placeholder" },
      { key: "catalog.noResults", label: "No Results Text" },
      { key: "app.name", label: "Store Name" },
    ],
  },
  {
    title: "Products",
    keys: [
      { key: "product.singlePrice", label: "Single Price Label" },
      { key: "product.bulkPrice", label: "Bulk Price Label" },
      { key: "product.viewDetails", label: "View Details Button" },
      { key: "product.backToCatalog", label: "Back Button" },
      { key: "product.related", label: "Related Products Title" },
      { key: "product.orderWhatsApp", label: "WhatsApp Button Text" },
    ],
  },
  {
    title: "Navigation",
    keys: [
      { key: "nav.catalog", label: "Catalog Tab" },
      { key: "nav.admin", label: "Admin Tab" },
    ],
  },
];

const COLOR_LABELS = ["Color 1 (Yellow)", "Color 2 (Blue)", "Color 3 (Pink)"];
const COLOR_KEYS = ["color1", "color2", "color3"] as const;

function SecurityTab() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [pinCurrentVal, setPinCurrentVal] = useState("");
  const [pinNewVal, setPinNewVal] = useState("");
  const [pinConfirmVal, setPinConfirmVal] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [showLoginLogs, setShowLoginLogs] = useState(false);

  const { data: loginLogs = [], refetch: refetchLogs } = useQuery<LoginLog[]>({
    queryKey: ["loginLogs"],
    queryFn: fetchLoginLogs,
    enabled: showLoginLogs,
  });

  function getPinStrength(pin: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
    if (pin.length < 6) return { level: 0, label: "", color: "" };
    const hasLetter = /[a-zA-Z]/.test(pin);
    const hasNumber = /[0-9]/.test(pin);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pin);
    const longEnough = pin.length >= 10;
    const score = (hasLetter ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0) + (longEnough ? 1 : 0);
    if (score <= 1) return { level: 1, label: t("admin.pinStrength.weak"), color: "bg-red-400" };
    if (score <= 2) return { level: 2, label: t("admin.pinStrength.fair"), color: "bg-yellow-400" };
    return { level: 3, label: t("admin.pinStrength.strong"), color: "bg-green-500" };
  }

  const pinStrength = getPinStrength(pinNewVal);

  const handleChangePin = async () => {
    setPinError("");
    if (pinNewVal.length < 6) {
      setPinError(t("admin.pinTooShort"));
      return;
    }
    if (!/[a-zA-Z]/.test(pinNewVal) || !/[0-9]/.test(pinNewVal)) {
      setPinError(t("admin.pinComplexity"));
      return;
    }
    if (pinNewVal !== pinConfirmVal) {
      setPinError(t("admin.pinMismatch"));
      return;
    }
    setPinLoading(true);
    try {
      await changeAdminPin(pinCurrentVal, pinNewVal);
      setPinSuccess(true);
      setPinCurrentVal("");
      setPinNewVal("");
      setPinConfirmVal("");
      toast({ title: t("admin.pinChanged"), variant: "default" });
      setTimeout(() => {
        clearAdminSession();
        window.location.reload();
      }, 1800);
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : "Error");
    }
    setPinLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Change Password */}
      <div>
        <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          {t("admin.changePin")}
        </div>
        <div className="space-y-3">
          {/* Current PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {t("admin.currentPin")}
            </label>
            <div className="relative">
              <Input
                type={showCurrentPin ? "text" : "password"}
                className="rounded-xl border-2 pr-10 font-mono tracking-widest"
                placeholder="••••"
                value={pinCurrentVal}
                onChange={(e) => { setPinCurrentVal(e.target.value); setPinError(""); setPinSuccess(false); }}
                disabled={pinLoading || pinSuccess}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {t("admin.newPin")}
            </label>
            <div className="relative">
              <Input
                type={showNewPin ? "text" : "password"}
                className="rounded-xl border-2 pr-10 font-mono tracking-widest"
                placeholder="••••"
                value={pinNewVal}
                onChange={(e) => { setPinNewVal(e.target.value); setPinError(""); setPinSuccess(false); }}
                disabled={pinLoading || pinSuccess}
              />
              <button
                type="button"
                onClick={() => setShowNewPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {t("admin.confirmPin")}
            </label>
            <div className="relative">
              <Input
                type={showConfirmPin ? "text" : "password"}
                className="rounded-xl border-2 pr-10 font-mono tracking-widest"
                placeholder="••••"
                value={pinConfirmVal}
                onChange={(e) => { setPinConfirmVal(e.target.value); setPinError(""); setPinSuccess(false); }}
                disabled={pinLoading || pinSuccess}
                onKeyDown={(e) => e.key === "Enter" && !pinLoading && handleChangePin()}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password strength meter */}
          {pinNewVal.length > 0 && (
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      pinStrength.level >= level ? pinStrength.color : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              {pinStrength.label && (
                <p className={`text-xs font-semibold ${
                  pinStrength.level === 1 ? "text-red-500" :
                  pinStrength.level === 2 ? "text-yellow-600" : "text-green-600"
                }`}>{pinStrength.label}</p>
              )}
            </div>
          )}

          {pinError && (
            <p className="text-red-500 text-sm font-semibold">{pinError}</p>
          )}
          {pinSuccess && (
            <p className="text-green-600 text-sm font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {t("admin.pinChanged")}
            </p>
          )}

          <Button
            onClick={handleChangePin}
            disabled={!pinCurrentVal || !pinNewVal || !pinConfirmVal || pinLoading || pinSuccess}
            className="rounded-xl font-bold px-5 w-full"
          >
            {pinLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("admin.pinSave")}
              </span>
            ) : pinSuccess ? (
              <span className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {t("admin.pinChanged")}
              </span>
            ) : (
              t("admin.pinSave")
            )}
          </Button>
        </div>
      </div>

      {/* Login Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t("admin.loginLogs")}
          </div>
          <button
            onClick={() => { setShowLoginLogs((v) => !v); if (!showLoginLogs) refetchLogs(); }}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
          >
            {showLoginLogs ? "Hide" : "Show"}
          </button>
        </div>
        {showLoginLogs && (
          loginLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.loginLogs.empty")}</p>
          ) : (
            <div className="space-y-2">
              {loginLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                    log.success
                      ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${log.success ? "bg-green-500" : "bg-red-500"}`} />
                    <span className={`font-semibold ${log.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                      {log.success ? t("admin.loginLogs.success") : t("admin.loginLogs.failed")}
                    </span>
                    {log.ip && <span className="text-muted-foreground font-mono text-xs">· {log.ip}</span>}
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function SiteSettingsModal({ open, onClose }: Props) {
  const { settings, update } = useSiteSettings();
  const { lang } = useI18n();
  const [editLang, setEditLang] = useState<Language>(lang as Language);

  const overridesForLang = settings.textOverrides[editLang] ?? {};

  const handleTextChange = (key: string, value: string) => {
    const updated = {
      ...settings.textOverrides,
      [editLang]: {
        ...overridesForLang,
        [key]: value,
      },
    };
    update({ textOverrides: updated });
  };

  const handleTextClear = (key: string) => {
    const updated = { ...overridesForLang };
    delete updated[key];
    update({
      textOverrides: { ...settings.textOverrides, [editLang]: updated },
    });
  };

  const resetColors = () => {
    update({ color1: "#FEC00B", color2: "#01BCF3", color3: "#EE4C9F" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Site Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="rounded-2xl mb-4 shrink-0">
            <TabsTrigger value="appearance" className="rounded-xl text-sm font-bold">Appearance</TabsTrigger>
            <TabsTrigger value="text" className="rounded-xl text-sm font-bold">Text</TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl text-sm font-bold">Security</TabsTrigger>
          </TabsList>

          {/* ── APPEARANCE TAB ── */}
          <TabsContent value="appearance" className="overflow-y-auto flex-1 space-y-6 pr-1">
            {/* Colors */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Brand Colors</div>
                <button
                  onClick={resetColors}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {COLOR_KEYS.map((key, i) => (
                  <label key={key} className="cursor-pointer">
                    <div
                      className="w-full h-16 rounded-2xl border-2 border-border mb-2 overflow-hidden flex items-center justify-center relative group"
                      style={{ background: settings[key] }}
                    >
                      <input
                        type="color"
                        value={settings[key]}
                        onChange={(e) => update({ [key]: e.target.value })}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white px-2 py-0.5 rounded-full">
                        Pick
                      </span>
                    </div>
                    <div className="text-xs text-center text-muted-foreground font-medium">{COLOR_LABELS[i]}</div>
                    <div className="text-xs text-center font-mono text-foreground">{settings[key].toUpperCase()}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Font */}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Font</div>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(FONT_PRESETS) as [FontPreset, typeof FONT_PRESETS[FontPreset]][]).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => update({ font: key })}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                      settings.font === key
                        ? "border-foreground bg-foreground/5 font-bold"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <span className="text-sm font-semibold">{preset.label}</span>
                    {settings.font === key && (
                      <span className="text-xs bg-foreground text-background px-2 py-0.5 rounded-full font-bold">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── TEXT TAB ── */}
          <TabsContent value="text" className="overflow-y-auto flex-1 space-y-5 pr-1">
            {/* Language selector */}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Editing language</div>
              <div className="flex rounded-xl border-2 overflow-hidden">
                {(["EN", "AR", "KU"] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setEditLang(l)}
                    className={`flex-1 py-2 text-sm font-bold transition-colors ${
                      editLang === l
                        ? "bg-foreground text-background"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    } ${l !== "EN" ? "border-l-2" : ""}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {TEXT_SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">{section.title}</div>
                <div className="space-y-2">
                  {section.keys.map(({ key, label }) => {
                    const current = overridesForLang[key] ?? "";
                    const placeholder = getDefaultTranslation(key, editLang);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1 font-medium">{label}</div>
                          <Input
                            className="rounded-xl border-2 text-sm h-9"
                            value={current}
                            onChange={(e) => handleTextChange(key, e.target.value)}
                            placeholder={placeholder}
                          />
                        </div>
                        {current && (
                          <button
                            onClick={() => handleTextClear(key)}
                            className="mt-5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title="Reset to default"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── SECURITY TAB ── */}
          <TabsContent value="security" className="overflow-y-auto flex-1 pr-1">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
