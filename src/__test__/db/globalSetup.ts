import { GenericContainer } from "testcontainers";
import type { TestProject } from "vitest/node";

// One DynamoDB Local for the whole run. Pinned so local runs and CI agree.
export const DYNAMODB_LOCAL_IMAGE = "amazon/dynamodb-local:3.3.2";

declare module "vitest" {
  export interface ProvidedContext {
    dynamoEndpoint: string;
  }
}

export default async function setup(project: TestProject) {
  const dynamo = await new GenericContainer(DYNAMODB_LOCAL_IMAGE)
    .withExposedPorts(8000)
    .withCommand(["-jar", "DynamoDBLocal.jar", "-inMemory", "-sharedDb"])
    .start();
  project.provide("dynamoEndpoint", `http://${dynamo.getHost()}:${dynamo.getMappedPort(8000)}`);
  return async () => {
    await dynamo.stop();
  };
}
