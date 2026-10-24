// Runs the production build against a throwaway DynamoDB Local container for
// the e2e suite.
import { spawn } from "node:child_process";

import { CreateTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GenericContainer } from "testcontainers";

const PORT = process.env.E2E_PORT ?? "3977";
const TABLE = "videonote-e2e";

const startDynamo = async () => {
  const container = await new GenericContainer("amazon/dynamodb-local:3.3.2")
    .withExposedPorts(8000)
    .withCommand(["-jar", "DynamoDBLocal.jar", "-inMemory", "-sharedDb"])
    .start();
  const endpoint = `http://${container.getHost()}:${container.getMappedPort(8000)}`;
  const client = new DynamoDBClient({
    region: "ap-southeast-2",
    endpoint,
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
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
  client.destroy();
  return {
    env: {
      DYNAMODB_ENDPOINT: endpoint,
      DYNAMODB_TABLE: TABLE,
      AWS_REGION: "ap-southeast-2",
    },
    stop: () => container.stop(),
  };
};

const db = await startDynamo();
const app = spawn("pnpm", ["exec", "next", "start", "-p", PORT, "-H", "127.0.0.1"], {
  stdio: "inherit",
  env: {
    ...process.env,
    ...db.env,
    JWT_TOKEN_SECRET: process.env.JWT_TOKEN_SECRET ?? "e2e-secret",
  },
});

const stop = async () => {
  app.kill();
  await db.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
app.on("exit", async (code) => {
  await db.stop();
  process.exit(code ?? 0);
});
