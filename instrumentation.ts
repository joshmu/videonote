import * as Sentry from "@sentry/nextjs";

// Every route runs on Node.js (no middleware or edge routes), so only the
// server SDK is registered.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

// Unhandled errors from API routes and server rendering.
export const onRequestError = Sentry.captureRequestError;
