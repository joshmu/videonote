import { describe, expect, it } from "vitest";

import { classifySrc, summarise } from "../../../scripts/usage-report.mjs";

const NOW = Date.parse("2026-10-31T00:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => NOW - days * DAY;

const project = (projectId: string, ownerId: string, overrides = {}) => ({
  projectId,
  ownerId,
  createdAt: daysAgo(50),
  src: "https://www.youtube.com/watch?v=abc",
  shared: false,
  ...overrides,
});

describe("classifySrc", () => {
  it.each([
    ["", "noVideo"],
    ["blob:https://videonote.app/1", "localFile"],
    ["https://vimeo.com/1", "web"],
    ["youtube.com/watch?v=abc", "linkWithoutScheme"],
    ["my holiday video", "notALink"],
    ["holiday", "notALink"],
  ])("files %j as %s", (src, kind) => {
    expect(classifySrc(src).kind).toBe(kind);
  });

  it("drops www from the host", () => {
    expect(classifySrc("https://www.youtube.com/watch?v=abc").host).toBe("youtube.com");
  });
});

describe("summarise", () => {
  const users = [
    { userId: "a", createdAt: daysAgo(100) },
    { userId: "b", createdAt: daysAgo(10), lastSeenOn: "2026-10-29" },
    { userId: "c", createdAt: daysAgo(3) },
  ];
  const projects = [project("p1", "a", { shared: true }), project("p2", "b"), project("p3", "b")];
  const notes = [
    { projectId: "p1", createdAt: daysAgo(40) },
    { projectId: "p1", createdAt: daysAgo(2) },
    { projectId: "p2", createdAt: daysAgo(20) },
  ];
  const report = summarise(users, projects, notes, NOW);

  it("walks the funnel from signup to Share", () => {
    expect(report.funnel).toEqual({
      signedUp: 3,
      madeProject: 2,
      wroteNote: 2,
      wrote5Notes: 0,
      wrote20Notes: 0,
      shared: 1,
    });
  });

  it("counts recent activity per window, by the Project's owner", () => {
    expect(report.windows["7d"]).toEqual({
      signups: 1,
      projects: 0,
      notes: 1,
      noters: 1,
      notALink: 0,
      seen: 1,
    });
    expect(report.windows["30d"]).toEqual({
      signups: 2,
      projects: 0,
      notes: 2,
      noters: 2,
      notALink: 0,
      seen: 1,
    });
  });

  it("counts a noter as returning only across calendar weeks", () => {
    expect(report.returningNoters).toBe(1);
  });

  it("counts recent Projects whose video isn't a link", () => {
    const words = [project("w1", "a", { src: "holiday", createdAt: daysAgo(1) })];

    expect(summarise(users, words, [], NOW).windows["7d"].notALink).toBe(1);
  });

  it("counts Projects with no Notes", () => {
    expect(report.projectsWithoutNotes).toBe(1);
  });

  it("keeps a host out of the report until enough Projects use it", () => {
    const rare = [project("r1", "a", { src: "https://rare.example/video" })];
    const common = Array.from({ length: 5 }, (_, i) => project(`c${i}`, "a"));

    expect(summarise(users, [...rare, ...common], [], NOW).hosts).toEqual({ "youtube.com": 5 });
  });

  it("never carries an id or a video link in its output", () => {
    const output = JSON.stringify(report);

    expect(output).not.toContain("watch?v=abc");
    expect(output).not.toContain('"p1"');
    expect(output).not.toContain('"a"');
  });
});
