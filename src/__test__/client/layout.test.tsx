import { existsSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";

import { Layout } from "@/components/Layout/Layout";

vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const ORIGIN = "https://videonote.app";

test.each([
  ['meta[property="og:image"]'],
  ['meta[name="twitter:image"]'],
  ['meta[itemprop="image"]'],
])("%s points at an image served from public/", (selector) => {
  render(<Layout>page</Layout>);

  const url = document.querySelector(selector)?.getAttribute("content") ?? "";

  expect(url.startsWith(`${ORIGIN}/`)).toBe(true);
  expect(existsSync(join(process.cwd(), "public", url.slice(ORIGIN.length)))).toBe(true);
});
