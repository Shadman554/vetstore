import { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/lib/use-site-settings";
import { useI18n } from "@/lib/i18n";
import { saveAdminSession, isAdminSessionValid } from "@/lib/admin-auth";

interface AdminPinGateProps {
  children: React.ReactNode;
}

export function AdminPinGate({ children }: AdminPinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSiteSettings();
  const { t } = useI18n();

  useEffect(() => {
    if (isAdminSessionValid()) setUnlocked(true);
  }, []);

  useEffect(() => {
    if (!unlocked) setTimeout(() => inputRef.current?.focus(), 100);
  }, [unlocked]);

  useEffect(() => {
    if (!lockUntil) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) {
        setLocked(false);
        setLockUntil(null);
        setError("");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading || locked) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "900");
        setLocked(true);
        setLockUntil(Date.now() + retryAfter * 1000);
        setPassword("");
        setLoading(false);
        return;
      }

      const data = await res.json() as { token?: string; expiresIn?: number; error?: string };

      if (!res.ok) {
        setError(data.error ?? t("admin.pinError"));
        setPassword("");
        setTimeout(() => setError(""), 3500);
      } else if (data.token && data.expiresIn) {
        saveAdminSession(data.token, data.expiresIn);
        setUnlocked(true);
        setError("");
      }
    } catch {
      setError("Could not reach the server. Make sure the backend is running.");
      setTimeout(() => setError(""), 4000);
    }

    setLoading(false);
  };

  if (unlocked) return <>{children}</>;

  const mins = Math.ceil(timeLeft / 60);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-lg"
            style={{ background: locked ? "#ef4444" : settings.color3 }}
          >
            {locked ? (
              <ShieldAlert className="w-9 h-9 text-white" />
            ) : (
              <Lock className="w-9 h-9 text-white" />
            )}
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            {t("admin.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {locked
              ? `Too many failed attempts`
              : t("admin.pinPrompt")}
          </p>
        </div>

        {locked ? (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-6 text-center space-y-2">
            <div className="text-4xl font-black font-mono text-red-500">
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Try again in {mins} {mins === 1 ? "minute" : "minutes"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("admin.pinPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`rounded-2xl border-2 h-14 text-center text-xl font-display tracking-widest pr-12 transition-colors ${
                  error
                    ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                    : "border-border"
                }`}
                data-testid="input-admin-pin"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center font-semibold">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl font-display font-bold text-lg border-0 shadow-md"
              style={{ background: settings.color3, color: "#fff" }}
              disabled={password.length < 1 || loading}
              data-testid="btn-admin-unlock"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("admin.pinUnlock")
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
