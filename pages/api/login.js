import { StatusCodes } from "http-status-codes";

import { toAccountUser } from "@/utils/apiHelpers";
import { authenticate } from "@/utils/user/identityIntake";

// One message for every credential failure so the reply does not reveal which part was wrong.
const CREDENTIALS_MSG = "Your Email and/or Password is incorrect.";

export default async (req, res) => {
  const outcome = await authenticate(req.body ?? {});

  switch (outcome.kind) {
    case "invalid":
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: outcome.reason === "missing" ? "Missing field(s)" : CREDENTIALS_MSG });
    case "notFound":
      return res.status(StatusCodes.NOT_FOUND).json({ msg: CREDENTIALS_MSG });
    case "wrongPassword":
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: CREDENTIALS_MSG });
    case "ok":
      // 302 - found
      return res.status(StatusCodes.MOVED_TEMPORARILY).json({
        user: toAccountUser(outcome.user),
        token: outcome.token,
      });
  }
};
