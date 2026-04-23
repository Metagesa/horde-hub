const STORAGE_KEY = "horda-admin-session";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export interface AdminSession {
  email: string;
  name: string;
  picture?: string;
  credential: string;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function decodeGoogleCredential(credential: string): AdminSession | null {
  try {
    const payload = credential.split(".")[1];
    if (!payload) {
      return null;
    }

    const data = JSON.parse(decodeBase64Url(payload));
    if (!data.email) {
      return null;
    }

    return {
      email: String(data.email),
      name: String(data.name || data.email),
      picture: data.picture ? String(data.picture) : "",
      credential,
    };
  } catch {
    return null;
  }
}

export function getAdminEmails(): string[] {
  return String(import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getGoogleClientId(): string {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

export function isAllowedAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let resolved = false;
    let attempts = 0;

    const finishResolve = () => {
      if (resolved) {
        return;
      }

      resolved = true;
      resolve();
    };

    const finishReject = (error: Error) => {
      if (resolved) {
        return;
      }

      resolved = true;
      reject(error);
    };

    const pollForGoogle = () => {
      const timer = window.setInterval(() => {
        if (window.google?.accounts?.id) {
          window.clearInterval(timer);
          finishResolve();
          return;
        }

        attempts += 1;
        if (attempts >= 50) {
          window.clearInterval(timer);
          finishReject(
            new Error("No se pudo inicializar Google Identity Services.")
          );
        }
      }, 100);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_SCRIPT_SRC}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => finishResolve(), { once: true });
      existing.addEventListener(
        "error",
        () => finishReject(new Error("No se pudo cargar Google Identity Services")),
        {
          once: true,
        }
      );
      pollForGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => finishResolve();
    script.onerror = () =>
      finishReject(new Error("No se pudo cargar Google Identity Services"));
    document.head.appendChild(script);
    pollForGoogle();
  });
}

export function getStoredAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed.email || !parsed.credential) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function storeAdminSession(session: AdminSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAdminCredential(): string {
  return getStoredAdminSession()?.credential || "";
}
