import { expect, test } from "@playwright/test";

import { ProjectApiActions } from "@/shared/types";

import { ok, registeredUser } from "../support/api";

test.describe("settings", () => {
  test("Settings are created on first save, updated after, and come back with the account", async () => {
    const { api } = await registeredUser();
    const { project } = ok(await api.project(ProjectApiActions.CREATE, { title: "current" }));

    const first = ok(
      await api.updateSettings({ currentProject: project._id!, playOffset: 2, showHints: false }),
    ).settings;
    expect(first).toMatchObject({ currentProject: project._id, playOffset: 2, showHints: false });

    const second = ok(await api.updateSettings({ seekJump: 10, sidebarWidth: 420 })).settings;
    expect(second).toMatchObject({
      currentProject: project._id,
      playOffset: 2,
      showHints: false,
      seekJump: 10,
      sidebarWidth: 420,
    });

    expect(ok(await api.auth()).user.settings).toMatchObject({
      currentProject: project._id,
      seekJump: 10,
    });
  });

  test("only the editable Settings fields are written", async () => {
    const { api, user } = await registeredUser();

    const { settings } = ok(
      await api.updateSettings({ playOffset: 1, user: "someone-else" } as never),
    );

    expect(settings.user).toBe(user._id);
  });
});
