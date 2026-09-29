import Cookies from "universal-cookie";

import {
  NoteApiAction,
  type NoteInterface,
  type ProjectApiActions,
  type ProjectInterface,
  type SettingsInterface,
  type ShareProjectInterface,
  type UserInterface,
} from "@/shared/types";

const TOKEN_COOKIE = "token";

/** Where the session token lives. The only code that touches the token cookie. */
export interface SessionStore {
  read(): string | undefined;
  write(token: string): void;
  remove(): void;
}

export const browserSession: SessionStore = {
  read: () => new Cookies().get(TOKEN_COOKIE),
  write: (token) => new Cookies().set(TOKEN_COOKIE, token, { path: "/" }),
  remove: () => new Cookies().remove(TOKEN_COOKIE, { path: "/" }),
};

/** Server side: reads the token from the request's cookie header and never sets a cookie. */
export const requestSession = (cookieHeader: string | undefined): SessionStore => ({
  read: () => new Cookies(cookieHeader || {}).get(TOKEN_COOKIE, { doNotUpdate: true }),
  write: () => {},
  remove: () => {},
});

export type ApiFailure =
  | { kind: "unauthorized"; status: number; msg: string }
  | { kind: "error"; status: number; msg: string; code?: string };

export type ApiResult<T> = { kind: "ok"; status: number; data: T } | ApiFailure;

/** A Note write, which a password-protected Share may answer by asking for its password. */
export type NoteWriteResult<T> =
  | ApiResult<T>
  | { kind: "sharePasswordRequired"; status: number; msg: string };

export type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

type AccountPayload = UserInterface & {
  projects: ProjectInterface[];
  settings?: SettingsInterface;
};
export type AuthReply = { user: AccountPayload };
export type SessionReply = { user: UserInterface; token: string };
export type ProjectReply = { project: ProjectInterface };
export type NoteReply = { note: NoteInterface };
export type NotesReply = { notes: NoteInterface[] };
export type UserReply = { user: UserInterface };
export type SettingsReply = { settings: SettingsInterface };
export type MsgReply = { msg: string };

/**
 * A Share read from the public route, by status: 401, 403, 404 or ok. A
 * password-protected Share's ok carries the Share token for Note writes.
 */
export type ShareAccess =
  | { kind: "ok"; project: ProjectInterface; shareToken?: string }
  | { kind: "passwordRequired" }
  | { kind: "incorrect" }
  | { kind: "notFound" }
  | { kind: "error"; msg: string };

const SHARE_STATUS: Record<number, ShareAccess> = {
  401: { kind: "passwordRequired" },
  403: { kind: "incorrect" },
  404: { kind: "notFound" },
};

// /api/user answers a wrong password with 401 as well; only this msg tells it
// apart from an expired session.
const WRONG_PASSWORD_MSG = "Password is incorrect.";
// /api/note answers 403 to a forbidden write too; only this code asks for the Share password.
const SHARE_PASSWORD_REQUIRED = "sharePasswordRequired";

type Credentials = { email: string; password: string; password2?: string };

export const createApiClient = ({
  fetch,
  session,
  origin = "",
}: {
  fetch: FetchFn;
  session: SessionStore;
  origin?: string;
}) => {
  const post = async <T>(
    path: string,
    body: object,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResult<T>> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...extraHeaders,
    };
    const token = session.read();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${origin}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } catch {
      return { kind: "error", status: 0, msg: "Could not reach the server." };
    }

    const data = await readJsonObject(res);
    const msg = typeof data?.msg === "string" ? data.msg : `Request failed (${res.status}).`;
    if (res.status === 401) return { kind: "unauthorized", status: res.status, msg };
    // Login answers 302 on success, so any status below 400 is ok.
    if (res.status >= 400) {
      const code = typeof data?.code === "string" ? data.code : undefined;
      return { kind: "error", status: res.status, msg, ...(code && { code }) };
    }
    if (!data) {
      return { kind: "error", status: res.status, msg: "Unexpected response from the server." };
    }

    if (typeof data.token === "string") session.write(data.token);
    return { kind: "ok", status: res.status, data: data as T };
  };

  // The Share token goes in its own header; Authorization carries only the session.
  const noteWrite = async <T>(body: object, shareToken?: string): Promise<NoteWriteResult<T>> => {
    const result = await post<T>(
      "/api/note",
      body,
      shareToken ? { "x-share-token": shareToken } : {},
    );
    if (result.kind === "error" && result.code === SHARE_PASSWORD_REQUIRED) {
      return { kind: "sharePasswordRequired", status: result.status, msg: result.msg };
    }
    return result;
  };

  return {
    auth: () => post<AuthReply>("/api/auth", {}),
    login: (credentials: Credentials) => post<SessionReply>("/api/login", credentials),
    register: (credentials: Credentials) => post<SessionReply>("/api/register", credentials),
    project: (
      action: ProjectApiActions,
      project: Partial<ProjectInterface>,
      share?: Partial<ShareProjectInterface>,
    ) => post<ProjectReply>("/api/project", { action, project, share }),
    saveNote: (note: Partial<NoteInterface>, shareToken?: string) =>
      noteWrite<NoteReply>({ note }, shareToken),
    removeDoneNotes: (projectId: string, shareToken?: string) =>
      noteWrite<NotesReply>({ action: NoteApiAction.REMOVE_DONE_NOTES, projectId }, shareToken),
    updateUser: (user: Partial<UserInterface>) =>
      post<UserReply>("/api/user", { action: "update", user }),
    removeAccount: async (
      user: Partial<UserInterface>,
    ): Promise<ApiResult<MsgReply> | { kind: "wrongPassword"; status: number; msg: string }> => {
      const result = await post<MsgReply>("/api/user", { action: "remove", user });
      if (result.kind === "unauthorized" && result.msg === WRONG_PASSWORD_MSG) {
        return { ...result, kind: "wrongPassword" };
      }
      return result;
    },
    updateSettings: (settings: Partial<SettingsInterface>) =>
      post<SettingsReply>("/api/settings", { settings }),
    openShare: async (shareUrl: string, password?: string): Promise<ShareAccess> => {
      const result = await post<{ user?: { projects?: ProjectInterface[] }; shareToken?: unknown }>(
        "/api/public_project",
        { shareUrl, password },
      );
      if (result.kind !== "ok")
        return SHARE_STATUS[result.status] ?? { kind: "error", msg: result.msg };
      const project = result.data.user?.projects?.[0];
      if (!project) return { kind: "error", msg: "Unexpected response from the server." };
      const { shareToken } = result.data;
      return { kind: "ok", project, ...(typeof shareToken === "string" && { shareToken }) };
    },
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;

/** The client the browser uses: global fetch, token in the cookie. */
export const browserApi: ApiClient = createApiClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  session: browserSession,
});

const readJsonObject = async (res: Response): Promise<Record<string, unknown> | null> => {
  try {
    const data: unknown = JSON.parse(await res.text());
    return typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};
