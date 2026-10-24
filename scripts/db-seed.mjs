// Seed a running local app with made-up data through its own API: a demo
// User with two Projects, Notes, and an editable Share. Never real user data.
const ORIGIN = process.env.SEED_ORIGIN ?? "http://localhost:3000";
const EMAIL = "demo@videonote.test";
const PASSWORD = "demo-password";

let token;
const post = async (path, body) => {
  const res = await fetch(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.status >= 400) throw new Error(`${path}: ${res.status} ${data.msg}`);
  if (data.token) token = data.token;
  return data;
};

const objectId = () =>
  Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0") +
  [...crypto.getRandomValues(new Uint8Array(8))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

try {
  await post("/api/login", { email: EMAIL, password: PASSWORD });
  console.log(`Already seeded: log in as ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
} catch {
  await post("/api/register", { email: EMAIL, password: PASSWORD, password2: PASSWORD });
}

const sample = "https://assets.joshmu.dev/sites/joshmu-dev-website/videos/videonote.mp4";
for (const title of ["Rough cut", "Final cut"]) {
  const { project } = await post("/api/project", {
    action: "CREATE",
    project: { title, src: sample },
  });
  for (const [time, content] of [
    [1.5, "Tighten the intro"],
    [4, "Colour looks warm here"],
    [8.2, "Music cue"],
  ]) {
    await post("/api/note", { note: { _id: objectId(), project: project._id, content, time } });
  }
  if (title === "Rough cut") {
    await post("/api/project", {
      action: "SHARE",
      project: { _id: project._id },
      share: { url: "demo-rough-cut", canEdit: true },
    });
  }
}
console.log(`Seeded: log in as ${EMAIL} / ${PASSWORD}; share at ${ORIGIN}/vn/demo-rough-cut`);
