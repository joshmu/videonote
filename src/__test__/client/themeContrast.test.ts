import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { THEME_BACKGROUND, ThemeType } from "@/context/themeContext";

vi.unmock("@/context/themeContext");

type Rgb = [number, number, number];

const css = readFileSync(resolve(process.cwd(), "src/styles/globals.css"), "utf8");

const token = (theme: string, name: string): string => {
  const block = css.slice(css.indexOf(`.${theme} {`));
  const value = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!value) throw new Error(`${theme} has no --${name}`);
  return value[1];
};

const rgb = (color: string): Rgb => {
  if (color.startsWith("#")) {
    return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as Rgb;
  }
  return color.match(/\d+/g)!.slice(0, 3).map(Number) as Rgb;
};

const mix = (top: Rgb, bottom: Rgb, alpha: number): Rgb =>
  top.map((channel, i) => channel * alpha + bottom[i] * (1 - alpha)) as Rgb;

const luminance = (color: Rgb): number => {
  const [r, g, b] = color.map((channel) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: Rgb, b: Rgb): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe.each(Object.values(ThemeType))("%s", (theme) => {
  const color = (name: string) => rgb(token(theme, name));
  const highlightedRow = () => mix(color("select"), color("bg"), 0.25);

  it.each([
    ["text on background", () => contrast(color("text"), color("bg"))],
    ["secondary text on background", () => contrast(color("text2"), color("bg"))],
    ["accent on background", () => contrast(color("accent"), color("bg"))],
    ["background on accent", () => contrast(color("bg"), color("accent"))],
    ["text on a highlighted row", () => contrast(color("text"), highlightedRow())],
    ["secondary text on a highlighted row", () => contrast(color("text2"), highlightedRow())],
    ["accent on a highlighted row", () => contrast(color("accent"), highlightedRow())],
    ["white on a hovered menu item", () => contrast([255, 255, 255], color("select"))],
  ])("%s meets 4.5:1", (_, measure) => {
    expect(measure()).toBeGreaterThanOrEqual(4.5);
  });

  it("gives the phone toolbar the theme's background", () => {
    expect(THEME_BACKGROUND[theme]).toBe(token(theme, "bg"));
  });
});
