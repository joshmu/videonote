import { StatusCodes } from "http-status-codes";
import type { NextApiHandler } from "next";

import { reportError } from "@/utils/reportError";
import { getStore } from "@/utils/store";

// No User has this id. Reading it proves the function can assume its AWS
// role and reach its table, without touching real data.
const PROBE_USER_ID = "000000000000000000000000";

/** Liveness for the uptime monitor: 200 when the Store answers, else 503. */
const handler: NextApiHandler = async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    await (await getStore()).getUser(PROBE_USER_ID);
  } catch (error) {
    await reportError(error);
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ status: "error" });
  }
  return res.status(StatusCodes.OK).json({ status: "ok" });
};

export default handler;
