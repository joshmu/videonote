import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export const CLIP_PATH = path.join(__dirname, ".cache", "clip.webm");

/** Generate the playable clip the browser journeys serve as every video (kept out of git). */
export default function globalSetup() {
  if (existsSync(CLIP_PATH)) return;
  mkdirSync(path.dirname(CLIP_PATH), { recursive: true });
  const source = "testsrc=duration=30:size=320x180:rate=12";
  execFileSync("ffmpeg", [
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    source,
    "-c:v",
    "libvpx",
    "-b:v",
    "100k",
    CLIP_PATH,
  ]);
}
