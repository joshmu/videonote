import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterModal } from "@/components/LoginPage/RegisterModal/RegisterModal";
import { TurnstileCheck } from "@/components/LoginPage/RegisterModal/TurnstileCheck";
import { browserApi } from "@/utils/apiClient";

const addAlert = vi.fn();

vi.mock("@/context/notificationContext", () => ({
  useNotificationContext: () => ({ addAlert }),
}));
vi.mock("@/utils/apiClient", () => ({ browserApi: { register: vi.fn() } }));
vi.mock("@/components/LoginPage/RegisterModal/TurnstileCheck", () => ({
  TurnstileCheck: vi.fn(() => null),
}));

const register = vi.mocked(browserApi.register);
const handleLogin = vi.fn();

const renderFilledIn = () => {
  const { container } = render(
    <RegisterModal toggleLoginView={vi.fn()} handleLogin={handleLogin} email="" />,
  );
  const fill = (id: string, value: string) =>
    fireEvent.change(container.querySelector(`#${id}`)!, { target: { id, value } });
  fill("email", "new@example.com");
  fill("password", "correct-password-1");
  fill("password2", "correct-password-1");
};

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Register" }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegisterModal with Turnstile on", () => {
  let passCheck: (token: string) => void;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key");
    vi.mocked(TurnstileCheck).mockImplementation((({ onToken }) => {
      passCheck = onToken;
      return null;
    }) as typeof TurnstileCheck);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("waits for the check before registering", () => {
    renderFilledIn();

    submit();

    expect(register).not.toHaveBeenCalled();
    expect(addAlert).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("sends the token once the check passes", async () => {
    register.mockResolvedValue({ kind: "ok" } as never);
    renderFilledIn();

    act(() => passCheck("token-1"));
    submit();

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith(expect.objectContaining({ turnstileToken: "token-1" })),
    );
  });

  it("asks for a fresh check after a refused signup", async () => {
    register.mockResolvedValue({ kind: "error", msg: "The email has already been used." } as never);
    renderFilledIn();

    act(() => passCheck("token-1"));
    submit();
    await waitFor(() => expect(addAlert).toHaveBeenCalled());
    register.mockClear();

    submit();

    expect(register).not.toHaveBeenCalled();
  });
});

describe("RegisterModal submit", () => {
  it("registers once when clicked again while the request is in flight", async () => {
    let answer: (result: { kind: "ok" }) => void = () => {};
    register.mockReturnValue(new Promise((resolve) => (answer = resolve)) as never);
    renderFilledIn();

    submit();
    submit();
    answer({ kind: "ok" });

    await waitFor(() => expect(handleLogin).toHaveBeenCalledTimes(1));
    expect(register).toHaveBeenCalledTimes(1);
  });

  it("stays registered once when clicked again while logging in", async () => {
    register.mockResolvedValue({ kind: "ok" } as never);
    renderFilledIn();

    submit();
    await waitFor(() => expect(handleLogin).toHaveBeenCalledTimes(1));
    submit();

    expect(register).toHaveBeenCalledTimes(1);
  });

  it("lets the User try again after a refused registration", async () => {
    register.mockResolvedValueOnce({ kind: "error", msg: "Email taken" } as never);
    register.mockResolvedValueOnce({ kind: "ok" } as never);
    renderFilledIn();

    submit();
    await waitFor(() =>
      expect(addAlert).toHaveBeenCalledWith({ type: "error", msg: "Email taken" }),
    );
    submit();

    await waitFor(() => expect(handleLogin).toHaveBeenCalledTimes(1));
    expect(register).toHaveBeenCalledTimes(2);
  });
});
