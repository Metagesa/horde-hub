function getAllowedAdminEmails() {
  return String(process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getGoogleClientId() {
  return String(
    process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || ""
  ).trim();
}

export async function verifyAdminCredential(credential: string) {
  if (!credential) {
    return false;
  }

  const adminEmails = getAllowedAdminEmails();
  const expectedAudience = getGoogleClientId();

  if (adminEmails.length === 0) {
    return false;
  }

  try {
    const url = new URL("https://oauth2.googleapis.com/tokeninfo");
    url.searchParams.set("id_token", credential);

    const res = await fetch(url);
    if (!res.ok) {
      return false;
    }

    const payload = (await res.json()) as {
      aud?: string;
      email?: string;
      email_verified?: string | boolean;
      exp?: string;
    };

    const email = String(payload.email || "").trim().toLowerCase();
    const emailVerified =
      payload.email_verified === true || payload.email_verified === "true";
    const audienceMatches =
      !expectedAudience || String(payload.aud || "").trim() === expectedAudience;
    const notExpired =
      !payload.exp || Number(payload.exp) * 1000 > Date.now() - 5_000;

    return Boolean(
      email &&
        emailVerified &&
        audienceMatches &&
        notExpired &&
        adminEmails.includes(email)
    );
  } catch {
    return false;
  }
}
