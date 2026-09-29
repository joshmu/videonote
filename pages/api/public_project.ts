import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";

import { connectDb } from "@/utils/mongoose";
import { openSharedProject } from "@/utils/share/shareAccess";

// Read a shared project: 401 password required, 403 wrong password, 404 no such Share.
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await connectDb();
  const { shareUrl, password } = req.body ?? {};

  let result: Awaited<ReturnType<typeof openSharedProject>>;
  try {
    result = await openSharedProject(shareUrl, password);
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error" });
  }

  switch (result.kind) {
    case "notFound":
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Share url does not exist." });
    case "passwordRequired":
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "shared project password required" });
    case "incorrect":
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "password incorrect" });
    case "ok":
      // Same shape as the signed-in user payload so the client reuses one path.
      return res.status(StatusCodes.OK).json({ user: { projects: [result.project] } });
  }
};
