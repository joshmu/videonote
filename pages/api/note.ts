import { StatusCodes } from "http-status-codes";

import { NoteApiAction, NoteInterface } from "@/root/src/components/shared/types";
import { extractAuthorId, withOptionalUser } from "@/utils/auth/withAuthenticatedUser";
import { removeDoneProjectNotes, upsertNote } from "@/utils/note/noteIntake";

export default withOptionalUser(async (req, res, ctx) => {
  const { action, note, projectId } = req.body as {
    action?: NoteApiAction;
    note?: NoteInterface;
    projectId?: string;
  };
  const authorId = extractAuthorId(ctx);

  try {
    if (action === NoteApiAction.REMOVE_DONE_NOTES) {
      const notes = await removeDoneProjectNotes(projectId!);
      return res.status(StatusCodes.OK).json({ notes, token: ctx.newToken });
    }

    const noteDoc = await upsertNote(note!, authorId);
    return res.status(StatusCodes.OK).json({ note: noteDoc.toObject(), token: ctx.newToken });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error", error });
  }
});
