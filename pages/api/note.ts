import { StatusCodes } from "http-status-codes";
import type { NextApiResponse } from "next";

import { NoteApiAction, NoteInterface } from "@/root/src/components/shared/types";
import { extractAuthorId, withOptionalUser } from "@/utils/auth/withAuthenticatedUser";
import { removeDoneProjectNotes, upsertNote } from "@/utils/note/noteIntake";

const DENIED = {
  invalid: { status: StatusCodes.BAD_REQUEST, msg: "Invalid note." },
  notFound: { status: StatusCodes.NOT_FOUND, msg: "Project not found." },
  forbidden: { status: StatusCodes.FORBIDDEN, msg: "Not allowed to edit notes in this project." },
  // `code` lets the client tell this 403 from a forbidden write.
  sharePasswordRequired: {
    status: StatusCodes.FORBIDDEN,
    msg: "Share password required.",
    code: "sharePasswordRequired",
  },
} as const;

const deny = (res: NextApiResponse, kind: keyof typeof DENIED) => {
  const { status, ...body } = DENIED[kind];
  return res.status(status).json(body);
};

export default withOptionalUser(async (req, res, ctx) => {
  const { action, note, projectId } = (req.body ?? {}) as {
    action?: NoteApiAction;
    note?: NoteInterface;
    projectId?: string;
  };
  // The Share token rides in its own header; Authorization carries only the session.
  const shareToken = req.headers["x-share-token"];
  const callerId = extractAuthorId(ctx);

  try {
    if (action === NoteApiAction.REMOVE_DONE_NOTES) {
      const result = await removeDoneProjectNotes(projectId, callerId, shareToken);
      if (result.kind !== "ok") return deny(res, result.kind);
      return res.status(StatusCodes.OK).json({ notes: result.notes, token: ctx.newToken });
    }

    if (typeof note !== "object" || note === null) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Note is required." });
    }
    const result = await upsertNote(note, callerId, shareToken);
    if (result.kind !== "ok") return deny(res, result.kind);
    return res.status(StatusCodes.OK).json({ note: result.note, token: ctx.newToken });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error" });
  }
});
