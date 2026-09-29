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

import { extractUser } from "@/utils/apiHelpers";
import { connectDb } from "@/utils/mongoose";
import { register } from "@/utils/user/identityIntake";

export default async (req, res) => {
  await connectDb();
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
        user: extractUser(outcome.user.toObject()),
        token: outcome.token,
      });
  }
};
