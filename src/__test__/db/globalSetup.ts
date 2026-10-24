import { MongoMemoryServer } from "mongodb-memory-server";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import type { TestProject } from "vitest/node";

// One mongod and one DynamoDB Local for the whole run. Pinned so local runs and CI agree.
const MONGOMS_VERSION = "8.2.6";
export const DYNAMODB_LOCAL_IMAGE = "amazon/dynamodb-local:3.3.2";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
    dynamoEndpoint: string;
  }
}

export default async function setup(project: TestProject) {
  const [server, dynamo]: [MongoMemoryServer, StartedTestContainer] = await Promise.all([
    MongoMemoryServer.create({ binary: { version: MONGOMS_VERSION } }),
    new GenericContainer(DYNAMODB_LOCAL_IMAGE)
      .withExposedPorts(8000)
      .withCommand(["-jar", "DynamoDBLocal.jar", "-inMemory", "-sharedDb"])
      .start(),
  ]);
  project.provide("mongoUri", server.getUri());
  project.provide("dynamoEndpoint", `http://${dynamo.getHost()}:${dynamo.getMappedPort(8000)}`);
  return async () => {
    await Promise.all([server.stop(), dynamo.stop()]);
  };
}
