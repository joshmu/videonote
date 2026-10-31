import { reportError } from "@/utils/reportError";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Whether a signup's Turnstile token shows a real browser. Runs only where
 * `TURNSTILE_SECRET_KEY` is set. If Cloudflare can't answer the signup goes
 * ahead: an outage there shouldn't stop people joining.
 */
export const passesTurnstile = async (token: unknown): Promise<boolean> => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;

  try {
    const reply = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    const { success } = await reply.json();
    return success === true;
  } catch (error) {
    await reportError(error);
    return true;
  }
};
