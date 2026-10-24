---
name: data-migration
description: Runbook for moving VideoNote's data from MongoDB to DynamoDB with `pnpm migrate` (export, plan, sync, verify, delta, reverse), including the rehearsal, the production cut-over and the rollback. Use when running or changing the migration.
---

# VideoNote data migration

`pnpm migrate <command>` (`scripts/migrate/cli.ts`, run with tsx). It needs
`MONGODB_URI` from `.env.local` and, for AWS tables, `AWS_PROFILE=personal`.
Add `--endpoint http://localhost:8000` to target DynamoDB Local.

| Command                                              | Does                                                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `export`                                             | Snapshots MongoDB to `~/.local/share/videonote-migration/` (mode 600) and prints the path. Snapshots hold user data: never copy one into the repo, a PR or a log.                                      |
| `plan --snapshot F`                                  | Counts what migrates and what is left out (unreachable records), ids only.                                                                                                                             |
| `sync --snapshot F --table T [--wcu 15] [--dry-run]` | Makes the table hold exactly the snapshot's items. Idempotent; paced to `--wcu` write units a second.                                                                                                  |
| `verify --snapshot F --table T`                      | For every migrated User and Share, compares what `/api/auth` and `/api/public_project` would send from MongoDB and from the table. Prints ids and JSON paths, never values. Exits 1 on any difference. |
| `delta --from F --to G --table T --since ISO`        | Applies MongoDB changes between two snapshots. Never overwrites a newer DynamoDB item, and never deletes one changed after `--since`.                                                                  |
| `reverse --since ISO --table T [--dry-run]`          | Rollback: copies Users, Projects (with Share and Notes list) and Notes changed on DynamoDB after `--since` back to MongoDB. DynamoDB deletions are not copied.                                         |

What is left out and why: `scripts/migrate/transform.ts` (`toRecords`) reads
the snapshot the way the Mongo store reads MongoDB. A Project counts only when
its owner lists it, a Note only when its Project lists it, a Share only while
it points back at its Project, and Settings only when their User references
them.

## Rehearsal (no AWS writes)

```bash
pnpm db:up
F=$(pnpm -s migrate export)
pnpm migrate plan --snapshot "$F"
pnpm migrate sync --snapshot "$F" --table videonote-local --endpoint http://localhost:8000 --wcu 1000
pnpm migrate verify --snapshot "$F" --table videonote-local --endpoint http://localhost:8000
```

`verify` reads MongoDB live, so run it straight after `export`. A write in
between shows up as a difference. Re-export and re-run if so.

## Cut-over

1. `F=$(pnpm -s migrate export)`, then `AWS_PROFILE=personal pnpm migrate sync --snapshot "$F" --table videonote-prod`. At 15 WCU this takes about 20 minutes for the current data.
2. Re-export, `sync` again (quick: only the changes), then `verify` against `videonote-prod`. Record the time as T.
3. Set `DATA_BACKEND=dynamodb` on Vercel Production and redeploy.
4. When the deployment is live: `G=$(pnpm -s migrate export)` and `pnpm migrate delta --from <snapshot from step 2> --to "$G" --table videonote-prod --since T`.
5. Smoke test: public share pages by script; a logged-in pass by the owner.
6. Watch Vercel errors and DynamoDB throttling (CloudWatch) for 48 hours.

## Rollback

1. Note the cut-over time C. Set `DATA_BACKEND=mongo` (or remove it) on Vercel Production and redeploy.
2. `AWS_PROFILE=personal pnpm migrate reverse --since C --table videonote-prod`. Run with `--dry-run` first to see the counts.
3. Deletions made on DynamoDB after C are not copied back. Compare the step 2 snapshot with a scan if any happened.
