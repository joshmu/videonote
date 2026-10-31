/**
 * @path /pages/api/register.js
 *
 * @project videonote
 * @file register.js
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 1st October 2020
 * @modified Wednesday, 16th December 2020 3:04:37 pm
 * @copyright © 2020 - 2020 MU
 */

import { StatusCodes } from "http-status-codes";

import { toAccountUser } from "@/utils/apiHelpers";
import { passesTurnstile } from "@/utils/auth/turnstile";
import { register } from "@/utils/user/identityIntake";

export default async (req, res) => {
  if (!(await passesTurnstile(req.body?.turnstileToken))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: "We couldn't confirm you're not a bot. Refresh the page and try again.",
    });
  }

  const outcome = await register(req.body ?? {});

  switch (outcome.kind) {
    case "invalid":
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg:
          outcome.reason === "missing" ? "Missing field(s)" : "The email you entered is invalid.",
      });
    case "emailTaken":
      return res.status(StatusCodes.CONFLICT).json({ msg: "The email has already been used." });
    case "ok":
      // 201 - created
      return res.status(StatusCodes.CREATED).json({
        user: toAccountUser(outcome.user),
        token: outcome.token,
      });
  }
};
