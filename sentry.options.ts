import type { BrowserOptions, NodeOptions } from "@sentry/nextjs";

/**
 * Settings shared by the browser and server SDKs. Sentry stays off wherever
 * `NEXT_PUBLIC_SENTRY_DSN` is unset: local dev, tests and CI. Vercel sets
 * `NEXT_PUBLIC_SENTRY_ENVIRONMENT` to production or preview per deployment.
 *
 * The repo is public and Sentry holds what it collects for 30 days, so it
 * gets as little as still explains an error: no request bodies (they carry
 * notes and share passwords), cookies, local variables or user details
 * beyond the id set in `withAuthenticatedUser`.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "development",
  tracesSampleRate: 0.1,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    stackFrameVariables: false,
    databaseQueryData: false,
  },
} satisfies BrowserOptions & NodeOptions;
