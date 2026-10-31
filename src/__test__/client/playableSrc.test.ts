import { describe, expect, it } from "vitest";

import { isGooglePage, playableSrc } from "@/utils/playableSrc";

describe("playableSrc", () => {
  it.each([
    ["https://www.dropbox.com/s/abc/cut.mp4?dl=0", "https://www.dropbox.com/s/abc/cut.mp4?raw=1"],
    ["https://dropbox.com/s/abc/cut.mp4", "https://dropbox.com/s/abc/cut.mp4?raw=1"],
    [
      "https://www.dropbox.com/scl/fi/abc/cut.mp4?rlkey=key&st=st&dl=0",
      "https://www.dropbox.com/scl/fi/abc/cut.mp4?rlkey=key&st=st&raw=1",
    ],
  ])("asks Dropbox for the file itself: %s", (shared, file) => {
    expect(playableSrc(shared)).toBe(file);
  });

  it("leaves a Dropbox folder link alone", () => {
    const folder = "https://www.dropbox.com/scl/fo/abc/folder?rlkey=key&dl=0";
    expect(playableSrc(folder)).toBe(folder);
  });

  it("leaves other links alone", () => {
    expect(playableSrc("https://example.com/dropbox.com/s/cut.mp4?dl=0")).toBe(
      "https://example.com/dropbox.com/s/cut.mp4?dl=0",
    );
  });
});

describe("isGooglePage", () => {
  it.each([
    "https://drive.google.com/file/d/abc/view?usp=sharing",
    "https://docs.google.com/document/d/abc/edit",
  ])("recognises %s", (link) => {
    expect(isGooglePage(link)).toBe(true);
  });

  it.each(["https://example.com/clip.mp4", "https://www.youtube.com/watch?v=abc", "clip", ""])(
    "ignores %s",
    (link) => {
      expect(isGooglePage(link)).toBe(false);
    },
  );
});
