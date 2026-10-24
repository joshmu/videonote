import { expect, test } from "@playwright/test";

import { newClient, ok, PASSWORD, registeredUser, uniqueEmail } from "../support/api";

test.describe("identity", () => {
  test("a new User registers, is signed in and starts with no Projects", async () => {
    const { api, email, user } = await registeredUser();

    expect(user.email).toBe(email);
    expect(user).not.toHaveProperty("password");
    const account = ok(await api.auth()).user;
    expect(account.email).toBe(email);
    expect(account.projects).toEqual([]);
  });

  test("an email registers once", async () => {
    const { email } = await registeredUser();

    const again = await newClient().api.register({
      email,
      password: PASSWORD,
      password2: PASSWORD,
    });

    expect(again).toMatchObject({ kind: "error", status: 409 });
  });

  test("login takes the right password only", async () => {
    const { email } = await registeredUser();
    const { api, session } = newClient();

    expect(await api.login({ email, password: "wrong" })).toMatchObject({
      kind: "unauthorized",
    });
    expect(await api.login({ email: uniqueEmail(), password: PASSWORD })).toMatchObject({
      kind: "error",
      status: 404,
    });
    expect(ok(await api.login({ email, password: PASSWORD })).user.email).toBe(email);
    expect(session.token).toBeTruthy();
  });

  test("a garbage session token is unauthorized", async () => {
    const { api, session } = newClient();
    session.write("not-a-token");

    expect(await api.auth()).toMatchObject({ kind: "unauthorized" });
  });

  test("a profile update changes username and email and keeps the session", async () => {
    const { api } = await registeredUser();
    const email = uniqueEmail();

    const { user } = ok(await api.updateUser({ username: "e2e-renamed", email }));

    expect(user).toMatchObject({ username: "e2e-renamed", email });
    expect(ok(await api.auth()).user.email).toBe(email);
    expect(ok(await newClient().api.login({ email, password: PASSWORD })).user.email).toBe(email);
  });

  test("a profile update cannot take another User's email", async () => {
    const other = await registeredUser();
    const { api } = await registeredUser();

    expect(await api.updateUser({ email: other.email })).toMatchObject({
      kind: "error",
      status: 409,
    });
  });

  test("removing an account needs its password and frees the email", async () => {
    const { api, email } = await registeredUser();

    expect(await api.removeAccount({ password: "wrong" })).toMatchObject({ kind: "wrongPassword" });
    ok(await api.removeAccount({ password: PASSWORD }));

    expect(await api.auth()).toMatchObject({ kind: "unauthorized" });
    expect(await newClient().api.login({ email, password: PASSWORD })).toMatchObject({
      status: 404,
    });
    ok(await newClient().api.register({ email, password: PASSWORD, password2: PASSWORD }));
  });
});
