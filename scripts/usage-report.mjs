// Print how VideoNote is being used, as aggregate counts. Read-only, and paced
// so a scan of prod leaves most of the table's read capacity for Users.
//   AWS_PROFILE=personal node scripts/usage-report.mjs videonote-prod
// The output holds no ids, emails, Notes or video links. See docs/product-metrics.md.
import { pathToFileURL } from "node:url";

const DAY = 24 * 60 * 60 * 1000;
const WINDOWS = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 };
const READ_UNITS_PER_SECOND = 8;
// a host with fewer Projects than this could point at one person's link
const MIN_HOST_COUNT = 5;

const month = (time) => new Date(time).toISOString().slice(0, 7);
const isoWeek = (time) => Math.floor((time + 3 * DAY) / (7 * DAY));

/** What a Project's video src is, without keeping the src itself. */
export const classifySrc = (src) => {
  if (!src) return { kind: "noVideo" };
  if (src.startsWith("blob:")) return { kind: "localFile" };
  try {
    return { kind: "web", host: new URL(src.trim()).hostname.replace(/^www\./, "") };
  } catch {
    if (/\s/.test(src.trim())) return { kind: "notALink" };
    return { kind: /^[\w-]+(\.[\w-]+)+(\/|$)/.test(src.trim()) ? "linkWithoutScheme" : "notALink" };
  }
};

/**
 * @param {{ userId: string, createdAt: number, lastSeenOn?: string }[]} users
 * @param {{ ownerId: string, projectId: string, createdAt: number, src: string, shared: boolean }[]} projects
 * @param {{ projectId: string, createdAt: number }[]} notes
 * @param {number} now
 */
export const summarise = (users, projects, notes, now) => {
  const projectById = new Map(projects.map((project) => [project.projectId, project]));
  const ownerOf = (note) => projectById.get(note.projectId)?.ownerId;
  const since = (days) => now - days * DAY;

  const notesByOwner = new Map();
  for (const note of notes) {
    const owner = ownerOf(note);
    if (owner) notesByOwner.set(owner, [...(notesByOwner.get(owner) ?? []), note.createdAt]);
  }
  const owners = new Set(projects.map((project) => project.ownerId));
  const sharers = new Set(projects.filter((p) => p.shared).map((p) => p.ownerId));
  const noteCounts = [...notesByOwner.values()].map((times) => times.length);
  const countWith = (min) => noteCounts.filter((count) => count >= min).length;

  const windows = Object.fromEntries(
    Object.entries(WINDOWS).map(([name, days]) => {
      const recent = (item) => item.createdAt >= since(days);
      const recentNotes = notes.filter(recent);
      return [
        name,
        {
          signups: users.filter(recent).length,
          projects: projects.filter(recent).length,
          notes: recentNotes.length,
          noters: new Set(recentNotes.map(ownerOf).filter(Boolean)).size,
          seen: users.filter((user) => Date.parse(user.lastSeenOn) >= since(days)).length,
        },
      ];
    }),
  );

  const cohorts = {};
  for (const user of users) {
    const cohort = (cohorts[month(user.createdAt)] ??= {
      signups: 0,
      madeProject: 0,
      wroteNote: 0,
    });
    cohort.signups++;
    if (owners.has(user.userId)) cohort.madeProject++;
    if (notesByOwner.has(user.userId)) cohort.wroteNote++;
  }

  const notesByMonth = {};
  for (const { createdAt } of notes) {
    notesByMonth[month(createdAt)] = (notesByMonth[month(createdAt)] ?? 0) + 1;
  }

  const sources = { noVideo: 0, localFile: 0, web: 0, linkWithoutScheme: 0, notALink: 0 };
  const hosts = {};
  for (const { src } of projects) {
    const { kind, host } = classifySrc(src);
    sources[kind]++;
    if (host) hosts[host] = (hosts[host] ?? 0) + 1;
  }

  const topTen = [...noteCounts].sort((a, b) => b - a).slice(0, 10);
  const last12 = (byMonth) =>
    Object.fromEntries(
      Object.keys(byMonth)
        .sort()
        .slice(-12)
        .map((key) => [key, byMonth[key]]),
    );

  return {
    totals: { users: users.length, projects: projects.length, notes: notes.length },
    funnel: {
      signedUp: users.length,
      madeProject: users.filter((user) => owners.has(user.userId)).length,
      wroteNote: notesByOwner.size,
      wrote5Notes: countWith(5),
      wrote20Notes: countWith(20),
      shared: users.filter((user) => sharers.has(user.userId)).length,
    },
    windows,
    // Users who wrote Notes in more than one calendar week, so came back to the app
    returningNoters: [...notesByOwner.values()].filter(
      (times) => new Set(times.map(isoWeek)).size > 1,
    ).length,
    topTenNotersShareOfNotes: notes.length
      ? Math.round((topTen.reduce((sum, count) => sum + count, 0) / notes.length) * 100) / 100
      : 0,
    projectsWithoutNotes: projects.filter(
      (project) => !notes.some((note) => note.projectId === project.projectId),
    ).length,
    sources,
    hosts: Object.fromEntries(
      Object.entries(hosts)
        .filter(([, count]) => count >= MIN_HOST_COUNT)
        .sort((a, b) => b[1] - a[1]),
    ),
    cohorts: last12(cohorts),
    notesByMonth: last12(notesByMonth),
  };
};

const scan = async (tableName) => {
  const { DynamoDBClient, ScanCommand } = await import("@aws-sdk/client-dynamodb");
  const client = new DynamoDBClient({ region: "ap-southeast-2" });
  const time = (attribute) =>
    attribute?.S ? Date.parse(attribute.S) : attribute?.N ? Number(attribute.N) : NaN;
  const users = [];
  const projects = [];
  const notes = [];

  let startKey;
  do {
    const page = await client.send(
      new ScanCommand({
        TableName: tableName,
        Limit: 200,
        ExclusiveStartKey: startKey,
        ReturnConsumedCapacity: "TOTAL",
        ProjectionExpression: "PK, SK, createdAt, ownerId, src, lastSeenOn, #share",
        ExpressionAttributeNames: { "#share": "share" },
      }),
    );
    for (const item of page.Items) {
      const [pk, sk, createdAt] = [item.PK.S, item.SK.S, time(item.createdAt)];
      if (sk === "PROFILE")
        users.push({ userId: pk.replace("USER#", ""), createdAt, lastSeenOn: item.lastSeenOn?.S });
      else if (sk === "PROJECT")
        projects.push({
          projectId: pk,
          ownerId: item.ownerId?.S,
          createdAt,
          src: item.src?.S ?? "",
          shared: !!item.share?.M,
        });
      else if (sk.startsWith("NOTE#")) notes.push({ projectId: pk, createdAt });
    }
    startKey = page.LastEvaluatedKey;
    const pause = (page.ConsumedCapacity.CapacityUnits / READ_UNITS_PER_SECOND) * 1000;
    await new Promise((resolve) => setTimeout(resolve, pause));
  } while (startKey);

  return { users, projects, notes };
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tableName = process.argv[2];
  if (!tableName) {
    console.error("usage: node scripts/usage-report.mjs <table>");
    process.exit(1);
  }
  const { users, projects, notes } = await scan(tableName);
  console.log(JSON.stringify(summarise(users, projects, notes, Date.now()), null, 2));
}
