import { useEffect, useState } from "react";

import { NoteInterface } from "@/root/src/components/shared/types";

export const useNoteProximity = ({
  notes,
  progress,
}: {
  notes: NoteInterface[];
  progress: { playedSeconds: number };
}) => {
  const [currentNote, setCurrentNote] = useState<NoteInterface | null>(null);

  // detect closest todo to current play position
  useEffect(() => {
    // empty list
    if (notes.length === 0 && currentNote !== null) setCurrentNote(null);

    // 1 todo
    if (notes.length === 1 && currentNote === null) setCurrentNote(notes[0]);

    // otherwise compare
    if (notes.length > 1) {
      // reduce in time order so equal-distance ties resolve to the later note
      const result = [...notes]
        .sort((a, b) => a.time - b.time)
        .reduce((closestNote, nextNote) => {
          const distA = Math.abs(closestNote.time - progress.playedSeconds);
          const distB = Math.abs(nextNote.time - progress.playedSeconds);
          return distA < distB ? closestNote : nextNote;
        });

      setCurrentNote(result);
    }
  }, [progress.playedSeconds]);

  const checkProximity = (note: NoteInterface): boolean =>
    currentNote !== null && currentNote._id === note._id;

  return { currentNote, checkProximity };
};
