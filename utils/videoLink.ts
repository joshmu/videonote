const LINK_PROTOCOLS = ["http:", "https:", "blob:"];
const LOOKS_LIKE_HOST = /^[\w-]+(\.[\w-]+)+([/:?#]|$)/;
// "clip.mp4" parses as a host, but it's a file on someone's computer
const FILE_NAME = /^[^/]+\.(mp4|mov|m4v|webm|mkv|avi|mp3|wav)$/i;

const isLink = (text: string): boolean => {
  try {
    return LINK_PROTOCOLS.includes(new URL(text).protocol);
  } catch {
    return false;
  }
};

/**
 * The link to save for what a User typed as a video, or `null` if it isn't one.
 * A link missing its scheme gets `https://`. Spaces in a pasted link are left
 * for `playableSrc` to repair, so only the check ignores them.
 */
export const videoLink = (input: string): string | null => {
  const trimmed = input.trim();
  const compact = trimmed.replace(/\s+/g, "");
  if (isLink(compact)) return trimmed;
  if (LOOKS_LIKE_HOST.test(compact) && !FILE_NAME.test(compact)) return `https://${compact}`;
  return null;
};

export const NOT_A_VIDEO_LINK =
  "That doesn't look like a video link. Paste the full link from your browser, or use a local video.";
