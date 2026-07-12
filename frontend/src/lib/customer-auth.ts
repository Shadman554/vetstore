const SESSION_KEY = "vetmarket-customer-session";
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

interface CustomerSession {
  token: string;
  expiresAt: number;
}

export function getCustomerToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as CustomerSession;
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s.token;
  } catch {
    return null;
  }
}

export function saveCustomerSession(token: string) {
  const session: CustomerSession = { token, expiresAt: Date.now() + THIRTY_DAYS_S * 1000 };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearCustomerSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isCustomerLoggedIn(): boolean {
  return getCustomerToken() !== null;
}
