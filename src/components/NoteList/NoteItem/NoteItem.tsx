/**
 * @path /src/components/NoteList/NoteItem/NoteItem.tsx
 *
 * @project videonote
 * @file NoteItem.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Monday, 14th September 2020
 * @modified Wednesday, 2nd December 2020 2:56:35 pm
 * @copyright © 2020 - 2020 MU
 */

import { Variants, motion } from "motion/react";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { useControlsContext } from "@/context/controlsContext";
import { useNoteContext } from "@/context/noteContext";
import { useSessionContext } from "@/context/sessionContext";
import { useSharedProjectContext } from "@/context/sharedProjectContext";
import { useVideoContext } from "@/context/videoContext";
import { useIsMount } from "@/hooks/useIsMount";
import { Select } from "@/shared/Select/Select";
import TimeDisplay from "@/shared/TimeDisplay/TimeDisplay";
import { NoteInterface } from "@/shared/types";

import DisplayUser from "./DisplayUser/DisplayUser";

// A note added in this session, or authored by the signed-in viewer.
const isOwnNote = (note: NoteInterface, userId?: string): boolean => {
  if (note.currentSession) return true;
  const authorId = typeof note.user === "string" ? note.user : note.user?._id;
  return userId !== undefined && authorId === userId;
};

interface NoteItemInterface {
  note: NoteInterface;
  closestProximity: boolean;
  childVariants: Variants;
}

export const NoteItem = ({ note, closestProximity, childVariants }: NoteItemInterface) => {
  const { user } = useSessionContext();
  const { checkCanEdit } = useSharedProjectContext();
  const { seekTo } = useVideoContext();
  const { toggleSmartControls } = useControlsContext();
  const { updateNote } = useNoteContext();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [state, setState] = useState<NoteInterface>(note);
  // The last value sent (or shown as saved), and how many saves are still in flight.
  const lastSentRef = useRef<NoteInterface>(note);
  const [pendingSaves, setPendingSaves] = useState(0);

  const isMount = useIsMount();

  // no smart controls whilst editing
  useEffect(() => {
    const enableSmartControls = !isEditing;
    toggleSmartControls(enableSmartControls);
  }, [isEditing]);

  // Show the saved note once no save is in flight, e.g. after a rejected edit.
  useEffect(() => {
    if (isMount || isEditing || pendingSaves > 0) return;
    lastSentRef.current = note;
    setState(note);
  }, [note, pendingSaves]);

  // update note whenever their is a change
  useEffect(() => {
    // do not update on initial load
    if (isMount) return;
    // do not update whilst editing content
    if (isEditing) return;
    // Emptied content is never sent: the saved content comes back.
    if (!state.content.trim()) {
      if (state.content !== note.content) setState({ ...state, content: note.content });
      return;
    }
    // do not update if state has not changed since it was last sent
    const lastSent = lastSentRef.current;
    if (Object.entries(state).every(([key, val]) => lastSent[key] === val)) return;

    lastSentRef.current = state;
    setPendingSaves((count) => count + 1);
    void updateNote(state).finally(() => setPendingSaves((count) => count - 1));
  }, [isEditing, state, isMount]);

  const handleTimeClick = (): void => {
    const updatedNote = { ...state, done: !state.done };
    setState(updatedNote);
  };

  const handleNoteClick = (): void => {
    seekTo(state.time);
  };
  const toggleEdit = (willEdit: boolean = undefined): void => {
    setIsEditing((current) => {
      const newState = willEdit === undefined ? !current : willEdit;
      return newState;
    });
  };
  const handleEdit = (event: ChangeEvent<HTMLInputElement>): void => {
    const updatedState = {
      ...state,
      content: event.target.value,
    };
    setState(updatedState);
  };
  const handleEditKeys = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      setIsEditing(false);
      return;
    }
  };

  const handleDoubleClick = (): void => {
    if (!checkCanEdit()) return;
    toggleEdit(true);
  };

  return (
    <motion.div
      key={state._id}
      // * childVariants used so we don't pass 'initial', 'animate' etc
      variants={childVariants}
      className={`${
        closestProximity ? "bg-opacity-25" : "bg-opacity-0"
      } relative border-b cursor-pointer border-themeText2 bg-themeSelectOpacity transition-colors duration-200 ease-out`}
    >
      <Select padding="p-0">
        <div className="relative flex items-center justify-start w-full h-full text-base">
          <div
            onClick={handleTimeClick}
            className={`${
              state.done && "line-through"
            } text-xs transition-colors duration-300 ease-in-out text-themeText2`}
          >
            <div className="px-2">
              <TimeDisplay seconds={state.time} lock={closestProximity} />
            </div>
          </div>

          <div
            onClick={handleNoteClick}
            className={`${
              state.done && !closestProximity && "text-themeText2"
            } w-full h-full py-2 pl-2`}
          >
            <DisplayUser author={note.user} own={isOwnNote(note, user?._id)} />
            {isEditing ? (
              <input
                type="text"
                value={state.content}
                onChange={handleEdit}
                onKeyDown={handleEditKeys}
                onDoubleClick={() => toggleEdit(false)}
                onBlur={() => toggleEdit(false)}
                className="placeholder-themeText text-themeText bg-themeBg focus:outline-none "
                autoFocus
              />
            ) : (
              <div onDoubleClick={handleDoubleClick} className="text-sm leading-5">
                {state.content}
              </div>
            )}
          </div>
        </div>
      </Select>
    </motion.div>
  );
};
