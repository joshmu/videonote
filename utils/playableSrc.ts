import ReactPlayer from "react-player";

/**
 * The url to play for a stored Project `src`. A pasted link can arrive with
 * spaces in it, which stops the player recognising a hosted video. Spaces go
 * only when that makes the link playable: a file name may really contain them.
 */
export const playableSrc = (src: string): string => {
  const trimmed = src.trim();
  if (ReactPlayer.canPlay(trimmed)) return trimmed;
  const compact = trimmed.replace(/\s+/g, "");
  return ReactPlayer.canPlay(compact) ? compact : trimmed;
};
