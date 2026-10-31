import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

// Source maps upload only where SENTRY_AUTH_TOKEN is set (Vercel builds, via
// the Sentry integration); elsewhere the build skips the upload.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Same-origin, and named so ad blockers don't drop the browser's events.
  tunnelRoute: "/vn-relay",
});
