/**
 * @path /utils/clientHelpers.ts
 *
 * @project videonote
 * @file clientHelpers.ts
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 22nd November 2020 7:25:48 pm
 * @copyright © 2020 - 2020 MU
 */

import { StatusCodes } from "http-status-codes";
import type { NextPageContext } from "next";
import Router from "next/router";
import isEmail from "validator/lib/isEmail";

type IsValidCredentialsType = {
  email: string;
  username?: string;
  password?: string;
  password2?: string;
  passwordRequired?: boolean;
  addAlert: (a: object) => {};
};

export const isValidCredentials = ({
  email,
  username = email,
  password = "",
  password2 = password,
  passwordRequired = true,
  addAlert,
}: IsValidCredentialsType): boolean => {
  let isValid = true;

  if (!checkEmail(email)) {
    addAlert({ type: "error", msg: "Email is invalid." });
    isValid = false;
  }
  if (!checkUsername(username)) {
    addAlert({
      type: "error",
      msg: "Username must be at least 6 characters long.",
    });
    isValid = false;
  }
  if (passwordRequired) {
    if (!checkPassword(password)) {
      addAlert({
        type: "error",
        msg: "Password needs to be at least 6 characters long.",
      });
      isValid = false;
    }
    if (!checkPasswordMatch(password, password2)) {
      addAlert({ type: "error", msg: "Passwords do not match." });
      isValid = false;
    }
  }

  return isValid;
};

export const checkEmail = (txt: string): boolean => {
  return isEmail(txt);
};
export const checkUsername = (txt: string): boolean => {
  return txt.length > 5;
};
export const checkPassword = (txt: string): boolean => {
  return txt.length > 5;
};
export const checkPasswordMatch = (password1: string, password2: string): boolean => {
  return password1 === password2;
};

/** A MongoDB ObjectId-compatible id: 4-byte seconds timestamp + 8 random bytes, as hex. */
export const createObjectId = (): string => {
  const seconds = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  const random = crypto.getRandomValues(new Uint8Array(8));
  return seconds + Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/**
 * Redirect from getInitialProps: a 302 on the server, the router on a
 * client-side navigation (no `ctx.res`). Returns the empty props Next expects.
 */
export const redirectFromInitialProps = (ctx: NextPageContext, location: string): {} => {
  if (ctx.res) {
    ctx.res.writeHead(StatusCodes.MOVED_TEMPORARILY, { Location: location });
    ctx.res.end();
  } else {
    Router.replace(location);
  }
  return {};
};

export const formatDuration = (secs: number): string => {
  const totalSecs = +secs;
  const sec = Math.floor(totalSecs % 60);
  const min = Math.floor(totalSecs / 60);
  return `${min}:${sec < 10 ? "0" + sec : sec}`;
};

export const copyToClipboard = (
  txt: string,
  addAlert: (alert: { type: "info"; msg: string }) => unknown,
  alertMsg = "Copied to clipboard!",
): Promise<void> => {
  if (!txt) return Promise.resolve();

  return navigator.clipboard.writeText(txt).then(
    () => {
      addAlert({ type: "info", msg: `${alertMsg} ${txt}` });
    },
    () => {
      console.log("clipboard copy failed");
    },
  );
};
