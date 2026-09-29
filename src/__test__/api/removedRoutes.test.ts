import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const API_DIR = path.resolve(__dirname, "../../../pages/api");
const ROUTE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

const routeExists = (route: string): boolean =>
  ROUTE_EXTENSIONS.some((ext) => fs.existsSync(path.join(API_DIR, `${route}${ext}`)));

describe("removed API routes", () => {
  it("resolves the api directory", () => {
    expect(routeExists("note")).toBe(true);
  });

  it.each(["public_project_update", "email"])("/api/%s has no route module", (route) => {
    expect(routeExists(route)).toBe(false);
  });
});
