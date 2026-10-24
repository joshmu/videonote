/**
 * MongoDB → DynamoDB migration for VideoNote. Run with `pnpm migrate <command>`.
 * The runbook is in .claude/skills/data-migration/SKILL.md.
 *
 *   export                       snapshot MongoDB to a private file (prints its path)
 *   plan    --snapshot F         what a snapshot migrates and what it leaves out
 *   sync    --snapshot F --table T [--endpoint U] [--wcu N] [--dry-run]
 *                                make table T hold exactly the snapshot's items
 *   delta   --from F --to G --table T --since ISO [--endpoint U]
 *                                apply MongoDB changes between two snapshots taken
 *                                around a cut-over, never undoing newer DynamoDB writes
 *   verify  --snapshot F --table T [--endpoint U]
 *                                compare what both stores send clients, per User and Share
 *   reverse --since ISO --table T [--endpoint U] [--dry-run]
 *                                rollback: copy DynamoDB writes after ISO back to MongoDB
 *
 * Needs MONGODB_URI (from .env.local) and, for AWS tables, AWS_PROFILE.
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import mongoose from "mongoose";

import { exportSnapshot, writeSnapshot } from "./mongo";
import { reverse } from "./reverse";
import { delta, sync } from "./sync";
import type { TableTarget } from "./table";
import { type Snapshot, toRecords } from "./transform";
import { verify } from "./verify";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    snapshot: { type: "string" },
    from: { type: "string" },
    to: { type: "string" },
    table: { type: "string" },
    endpoint: { type: "string" },
    since: { type: "string" },
    wcu: { type: "string", default: "15" },
    "dry-run": { type: "boolean", default: false },
  },
});

const required = (name: keyof typeof values): string => {
  const value = values[name];
  if (typeof value !== "string" || value === "") throw new Error(`--${name} is required`);
  return value;
};
const readSnapshot = (file: string): Snapshot => JSON.parse(readFileSync(file, "utf8"));
const target = (): TableTarget => ({ tableName: required("table"), endpoint: values.endpoint });
const progress = (label: string) => (done: number, total: number) => {
  if (done === total || done % 500 === 0) console.log(`${label}: ${done}/${total}`);
};

const summarise = (report: ReturnType<typeof toRecords>["report"]) => ({
  ...report,
  skipped: Object.fromEntries(
    Object.entries(report.skipped).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.length : value,
    ]),
  ),
});

const commands: Record<string, () => Promise<void>> = {
  async export() {
    const file = writeSnapshot(await exportSnapshot());
    console.log(file);
  },

  async plan() {
    const { report } = toRecords(readSnapshot(required("snapshot")));
    console.log(JSON.stringify(summarise(report), null, 2));
  },

  async sync() {
    const result = await sync(readSnapshot(required("snapshot")), target(), {
      dryRun: values["dry-run"],
      wcu: Number(values.wcu),
      onProgress: progress("sync"),
    });
    console.log(
      `items: ${result.wanted} wanted, ${result.existing} in table; ${result.written} written, ${result.deleted} deleted${values["dry-run"] ? " (dry run: nothing written)" : ""}`,
    );
  },

  async delta() {
    const result = await delta(
      readSnapshot(required("from")),
      readSnapshot(required("to")),
      target(),
      required("since"),
    );
    console.log(
      `delta: ${result.written} written, ${result.deleted} deleted, ${result.kept} left as DynamoDB has them`,
    );
  },

  async verify() {
    const result = await verify(readSnapshot(required("snapshot")), target(), {
      onProgress: progress("verify"),
    });
    console.log(
      `verified ${result.checked} Users and Shares: ${result.differences.length} differences`,
    );
    for (const difference of result.differences.slice(0, 50)) console.log(`  ${difference}`);
    if (result.differences.length > 0) process.exitCode = 1;
  },

  async reverse() {
    const result = await reverse(target(), required("since"), { dryRun: values["dry-run"] });
    console.log(JSON.stringify(result, null, 2));
  },
};

const main = async () => {
  const command = commands[positionals[0] ?? ""];
  if (!command) {
    console.error(`Usage: pnpm migrate <${Object.keys(commands).join("|")}> [options]`);
    process.exit(2);
  }
  try {
    await command();
  } finally {
    await mongoose.disconnect();
  }
};

void main();
