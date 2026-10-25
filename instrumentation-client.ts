import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "./sentry.options";

Sentry.init(sentryOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
