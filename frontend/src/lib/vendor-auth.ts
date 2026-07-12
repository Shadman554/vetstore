const SESSION_KEY = "vetmarket-vendor-session";
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

interface VendorSession {
  token: string;
  expiresAt: number;
}

export function getVendorToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as VendorSession;
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s.token;
  } catch {
    return null;
  }
}

export function saveVendorSession(token: string) {
  const session: VendorSession = { token, expiresAt: Date.now() + THIRTY_DAYS_S * 1000 };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearVendorSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isVendorLoggedIn(): boolean {
  return getVendorToken() !== null;
}
