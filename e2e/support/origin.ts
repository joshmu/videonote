/** The backend the e2e server runs on: `mongo` (default) or `dynamodb`. */
export const BACKEND = process.env.DATA_BACKEND === "dynamodb" ? "dynamodb" : "mongo";

// A port per backend, so a local server left running for one is never reused for the other.
export const PORT = BACKEND === "dynamodb" ? 3978 : 3977;

// localhost, not 127.0.0.1: the index page picks https for any other host.
export const ORIGIN = `http://localhost:${PORT}`;
