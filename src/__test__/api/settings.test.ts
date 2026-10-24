import { StatusCodes } from "http-status-codes";
import { afterEach, describe, expect, it, vi } from "vitest";

import handler from "@/api/settings";

import { seedUser } from "../db/seed";
import { BACKENDS, useTestStore } from "../db/testStores";
import { callApi, useTestJwtSecret } from "./http";

useTestJwtSecret();

const EMAIL = "owner@example.com";

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(BACKENDS)("/api/settings: %s", (backend) => {
  const store = useTestStore(backend);

  it("creates settings from the editable fields only, owned by the caller", async () => {
    const owner = await seedUser(store(), EMAIL);
    const other = await seedUser(store(), "other@example.com");

    const { status, body } = await callApi(
      handler,
      { settings: { playOffset: 2, seekJump: 5, user: other._id, role: "paid" } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.OK);
    expect(body.settings).toMatchObject({ playOffset: 2, seekJump: 5 });
    const stored = (await store().getUser(owner._id))!.settings;
    expect(stored).toMatchObject({ playOffset: 2, seekJump: 5 });
    expect(stored).not.toHaveProperty("role");
    expect(body.settings._id).toBe(stored!._id);
    expect((await store().getUser(other._id))!.settings).toBeNull();
  });

  it("updates the editable fields and ignores a user in the body", async () => {
    const owner = await seedUser(store(), EMAIL);
    const other = await seedUser(store(), "other@example.com");
    const settings = await store().saveSettings(owner._id, { playOffset: 1 });

    const { status } = await callApi(
      handler,
      {
        settings: {
          _id: settings._id,
          user: other._id,
          playOffset: 3,
          showHints: false,
          sidebarWidth: 300,
          currentProject: null,
        },
      },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.OK);
    expect((await store().getUser(owner._id))!.settings).toMatchObject({
      _id: settings._id,
      playOffset: 3,
      showHints: false,
      sidebarWidth: 300,
    });
    expect((await store().getUser(other._id))!.settings).toBeNull();
  });

  it("replies 500 with only a message when the database fails, logging the error", async () => {
    await seedUser(store(), EMAIL);
    vi.spyOn(store(), "saveSettings").mockRejectedValueOnce(new Error("settings store down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { status, body } = await callApi(handler, { settings: {} }, { email: EMAIL });

    expect(status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(body).toEqual({ msg: "Database error" });
    expect(console.error).toHaveBeenCalled();
  });
});
