import { createMongoStore } from "./mongoStore";
import type { Store } from "./types";

export type * from "./types";

let opening: Promise<Store> | null = null;

/**
 * The one way server code reaches the data. Opens the backend once and
 * reuses it; a failed attempt is retried on the next call.
 */
export const getStore = (): Promise<Store> => {
  opening ??= createMongoStore().catch((error) => {
    opening = null;
    throw error;
  });
  return opening;
};
