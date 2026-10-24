// Start (or reuse) DynamoDB Local for development, with data kept in a Docker
// volume, and create the app's table in it.
import { execFileSync } from "node:child_process";

import { CreateTableCommand, DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const CONTAINER = "videonote-dynamodb";
const IMAGE = "amazon/dynamodb-local:3.3.2";
const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000";
const TABLE = process.env.DYNAMODB_TABLE ?? "videonote-local";

const docker = (...args) => execFileSync("docker", args, { encoding: "utf8" }).trim();

const running = docker("ps", "-q", "--filter", `name=^${CONTAINER}$`);
if (!running) {
  const exists = docker("ps", "-aq", "--filter", `name=^${CONTAINER}$`);
  if (exists) docker("start", CONTAINER);
  else
    // prettier-ignore
    docker(
      "run", "-d", "--name", CONTAINER, "-p", "8000:8000",
      "-v", `${CONTAINER}:/home/dynamodblocal/data`, "--user", "root", IMAGE,
      "-jar", "DynamoDBLocal.jar", "-sharedDb", "-dbPath", "./data",
    );
}

const client = new DynamoDBClient({
  region: "ap-southeast-2",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});
for (let attempt = 0; ; attempt++) {
  try {
    const { TableNames = [] } = await client.send(new ListTablesCommand({}));
    if (!TableNames.includes(TABLE)) {
      await client.send(
        new CreateTableCommand({
          TableName: TABLE,
          AttributeDefinitions: [
            { AttributeName: "PK", AttributeType: "S" },
            { AttributeName: "SK", AttributeType: "S" },
          ],
          KeySchema: [
            { AttributeName: "PK", KeyType: "HASH" },
            { AttributeName: "SK", KeyType: "RANGE" },
          ],
          BillingMode: "PAY_PER_REQUEST",
        }),
      );
    }
    break;
  } catch (error) {
    if (attempt >= 20) throw error;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
console.log(`DynamoDB Local at ${ENDPOINT}, table ${TABLE}`);
