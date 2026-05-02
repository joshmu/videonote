import { StatusCodes } from "http-status-codes";
import { NextApiResponse } from "next";

import {
  NoteApiAction,
  NoteDocInterface,
  NoteInterface,
  UserDocInterface,
} from "@/root/src/components/shared/types";
import { withOptionalUser } from "@/utils/auth/withAuthenticatedUser";
import { generateAccessToken } from "@/utils/jwt";
import { Note, Project } from "@/utils/mongoose";

export default withOptionalUser(async (req, res, ctx) => {
  // 'note' is inclusive of projectId
  const { action, note }: { action: NoteApiAction; note: NoteInterface } = req.body;

  // different route if we choose to delete all complete notes from specified project
  if (action === NoteApiAction.REMOVE_DONE_NOTES) {
    return await removeDoneNotes(res, ctx.userDoc, req.body.projectId);
  }

  let noteDoc: NoteDocInterface;
  try {
    if (!action) {
      // use _id to search for doc, the rest is data to add
      const { _id, ...data } = note;

      noteDoc = await Note.findById(_id);

      // if note exists
      if (noteDoc) {
        // update user if we have one (in case we have a different user modifying a note)
        // todo: array of users who modify the note when original 'user' is present?
        if (!ctx.isGuest) data.user = ctx.userDoc._id as any;

        await noteDoc.updateOne({ $set: data });
        await noteDoc.save();
        // assign updated version
        noteDoc = await Note.findById(noteDoc._id);
      } else {
        // create note

        // add user info to note
        if (!ctx.isGuest) note.user = ctx.userDoc._id as any;

        // create with whole 'note' since we are passing a manually created _id for faster state management client side
        noteDoc = new Note(note);
        await noteDoc.save();
        // add note id to relevant project
        const projectDoc = await Project.findById(noteDoc.project);
        projectDoc.notes.push(noteDoc._id);
        await projectDoc.save();
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Database error", error });
  }

  // populate the 'user' field if it is a user created note
  if (noteDoc.user && !noteDoc.populated("user")) await noteDoc.populate("user", "username email");

  res.status(StatusCodes.OK).json({
    note: noteDoc.toObject(),
    token: ctx.newToken,
  });
});

const removeDoneNotes = async (
  res: NextApiResponse,
  userDoc: UserDocInterface | null,
  projectId: string,
): Promise<void> => {
  console.log("removing completed notes from project:", projectId);
  // delete all notes which match projectId and are 'done'
  await Note.deleteMany({ project: projectId, done: true });
  // return all notes for project
  const notes = await Note.find({ project: projectId }).lean();

  // token (keep resetting their session length) — guests get null
  const newToken = userDoc ? generateAccessToken(userDoc.email) : null;

  res.status(StatusCodes.OK).json({
    notes,
    token: newToken,
  });
};
