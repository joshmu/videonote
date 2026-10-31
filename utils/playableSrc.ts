import ReactPlayer from "react-player";

const DROPBOX_FILE = /^(www\.)?dropbox\.com$/;
const GOOGLE_PAGE = /^(drive|docs)\.google\.com$/;

const parsed = (src: string): URL | null => {
  try {
    return new URL(src.trim());
  } catch {
    return null;
  }
};

// A shared Dropbox link opens a preview page; `raw=1` asks for the file itself.
const dropboxFile = (src: string): string | null => {
  const url = parsed(src);
  if (!url || !DROPBOX_FILE.test(url.hostname)) return null;
  if (!/^\/(s|scl\/fi)\//.test(url.pathname)) return null;
  url.searchParams.delete("dl");
  url.searchParams.set("raw", "1");
  return url.toString();
};

/** Google Drive and Docs share links open a web page, which no player can play. */
export const isGooglePage = (src: string): boolean => {
  const url = parsed(src);
  return !!url && GOOGLE_PAGE.test(url.hostname);
};

/**
 * The url to play for a stored Project `src`. A pasted link can arrive with
 * spaces in it, which stops the player recognising a hosted video. Spaces go
 * only when that makes the link playable: a file name may really contain them.
 */
export const playableSrc = (src: string): string => {
  const dropbox = dropboxFile(src);
  if (dropbox) return dropbox;
  const trimmed = src.trim();
  if (ReactPlayer.canPlay(trimmed)) return trimmed;
  const compact = trimmed.replace(/\s+/g, "");
  return ReactPlayer.canPlay(compact) ? compact : trimmed;
};
