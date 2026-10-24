---
status: proposed
---

# DynamoDB single table instead of MongoDB

VideoNote's data moves from MongoDB Atlas to one DynamoDB table per environment
in `ap-southeast-2`. The reasons: one less vendor, the same $0 cost on the
always-free provisioned tier, and IAM roles assumed through OIDC instead of a
connection string.

The table has no secondary indexes. Uniqueness (email, share url, note id) and
id-only lookups use claim items written in transactions. A secondary index
would take capacity from the shared free-tier allowance. Project order lives in
a list on the user item, because live data doesn't follow id order. Ids stay
ObjectId-format hex strings, so existing tokens and URLs survive the
migration.

## Considered options

- **Cloudflare D1.** The closest relational fit, but it's built to be called
  from Workers. Using it means either a Worker API in front of it or moving the
  app onto Workers, where bcrypt password hashing would exceed the free CPU
  limit.
- **Stay on Atlas.** Free and no work, but a fourth vendor, and a connection
  string to manage.

## Consequences

- Each access pattern is designed up front (see
  `docs/plans/dynamodb-migration.md`). A new query shape may need a new item
  type or an index, and an index costs capacity.
