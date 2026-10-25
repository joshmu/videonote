import * as Sentry from "@sentry/nextjs";
import type { NextPage } from "next";
import Error, { type ErrorProps } from "next/error";

const ErrorPage: NextPage<ErrorProps> = ({ statusCode }) => <Error statusCode={statusCode} />;

ErrorPage.getInitialProps = async (context) => {
  // Awaited so the report is sent before the serverless function freezes.
  await Sentry.captureUnderscoreErrorException(context);
  return Error.getInitialProps(context);
};

export default ErrorPage;
