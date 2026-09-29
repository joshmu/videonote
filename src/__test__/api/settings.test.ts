import { StatusCodes } from "http-status-codes";
import { afterEach, describe, expect, it, vi } from "vitest";

import handler from "@/api/settings";
import { Settings, User } from "@/utils/mongoose";

import { useTestDb } from "../db/testDb";
import { callApi, useTestJwtSecret } from "./http";

useTestDb();
useTestJwtSecret();

const EMAIL = "owner@example.com";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("/api/settings", () => {
  it("creates settings from the editable fields only, owned by the caller", async () => {
    const owner = await User.create({ email: EMAIL });
    const other = await User.create({ email: "other@example.com" });

    const { status, body } = await callApi(
      handler,
      { settings: { playOffset: 2, seekJump: 5, user: other._id.toString(), role: "paid" } },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.OK);
    expect(body.settings).toMatchObject({ playOffset: 2, seekJump: 5 });
    const stored = await Settings.findOne({ user: owner._id }).lean();
    expect(stored).toMatchObject({ playOffset: 2, seekJump: 5 });
    expect(stored).not.toHaveProperty("role");
    expect(await Settings.countDocuments({ user: other._id })).toBe(0);
    expect((await User.findById(owner._id)).settings).toEqual(stored._id);
  });

  it("updates the editable fields and ignores a user in the body", async () => {
    const owner = await User.create({ email: EMAIL });
    const other = await User.create({ email: "other@example.com" });
    const settings = await Settings.create({ user: owner._id, playOffset: 1 });
    owner.settings = settings._id;
    await owner.save();

    const { status } = await callApi(
      handler,
      {
        settings: {
          _id: settings._id.toString(),
          user: other._id.toString(),
          playOffset: 3,
          showHints: false,
          sidebarWidth: 300,
          currentProject: null,
        },
      },
      { email: EMAIL },
    );

    expect(status).toBe(StatusCodes.OK);
    const stored = await Settings.findById(settings._id).lean();
    expect(stored.user).toEqual(owner._id);
    expect(stored).toMatchObject({ playOffset: 3, showHints: false, sidebarWidth: 300 });
  });

  it("replies 500 with only a message when the database fails, logging the error", async () => {
    await User.create({ email: EMAIL });
    vi.spyOn(Settings, "findOne").mockRejectedValueOnce(new Error("settings store down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { status, body } = await callApi(handler, { settings: {} }, { email: EMAIL });

    expect(status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(body).toEqual({ msg: "Database error" });
    expect(console.error).toHaveBeenCalled();
  });
});
