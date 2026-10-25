import * as Sentry from "@sentry/nextjs";

/**
 * Log an error a route caught and answered itself, and send it to Sentry.
 * Errors that escape a route reach Sentry through `onRequestError` in
 * `instrumentation.ts` instead.
 *
 * Waits for the send (at most 2s) so a serverless function that returns
 * straight after doesn't freeze with the event still queued. Where Sentry is
 * off it only logs.
 */
export const reportError = async (error: unknown): Promise<void> => {
  console.error(error);
  Sentry.captureException(error);
  await Sentry.flush(2000);
};
