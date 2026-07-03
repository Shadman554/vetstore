const SESSION_KEY = "kid-store-admin-session";

interface AdminSession {
  token: string;
  expiresAt: number;
}

export function getAdminToken(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdminSession;
    if (Date.now() > s.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s.token;
  } catch {
    return null;
  }
}

export function saveAdminSession(token: string, expiresIn: number) {
  const session: AdminSession = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAdminSessionValid(): boolean {
  return getAdminToken() !== null;
}
