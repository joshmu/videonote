import { describe, expect, it } from "vitest";

import { videoLink } from "@/utils/videoLink";

describe("videoLink", () => {
  it.each([
    "https://www.youtube.com/watch?v=abc",
    "http://example.com/clip.mp4",
    "blob:https://videonote.app/1234",
  ])("keeps the link %s", (link) => {
    expect(videoLink(link)).toBe(link);
  });

  it("trims a pasted link", () => {
    expect(videoLink("  https://vimeo.com/1  ")).toBe("https://vimeo.com/1");
  });

  it("leaves spaces inside a link for the player to repair", () => {
    expect(videoLink("https://youtu.be/ abc")).toBe("https://youtu.be/ abc");
  });

  it.each([
    ["youtube.com/watch?v=abc", "https://youtube.com/watch?v=abc"],
    ["www.youtube.com/watch?v=abc", "https://www.youtube.com/watch?v=abc"],
    ["youtu.be/abc", "https://youtu.be/abc"],
    ["example.com/clip.mp4", "https://example.com/clip.mp4"],
  ])("adds the missing scheme to %s", (typed, link) => {
    expect(videoLink(typed)).toBe(link);
  });

  it.each([
    "",
    "holiday",
    "my holiday video",
    "clip.mp4",
    "Final Cut v2.MOV",
    "/Users/someone/clip.mp4",
    "C:\\videos\\clip.mp4",
    "file:///Users/someone/clip.mp4",
    "ftp://example.com/clip.mp4",
  ])("rejects %j", (typed) => {
    expect(videoLink(typed)).toBeNull();
  });
});
