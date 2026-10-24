import {
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

/**
 * The DynamoDB client for this runtime:
 * - on Vercel, the environment's IAM role through Vercel's OIDC token (`AWS_ROLE_ARN`);
 * - with `DYNAMODB_ENDPOINT` (DynamoDB Local), placeholder credentials;
 * - otherwise the default AWS credential chain (e.g. `AWS_PROFILE`).
 */
export const dynamoClientFromEnv = (): DynamoDBClient => {
  const region = process.env.AWS_REGION ?? "ap-southeast-2";
  const endpoint = process.env.DYNAMODB_ENDPOINT;
  if (endpoint) {
    return new DynamoDBClient({
      region,
      endpoint,
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    });
  }
  if (process.env.VERCEL && process.env.AWS_ROLE_ARN) {
    // The roles trust Vercel's default audience, so no custom `audience` here.
    return new DynamoDBClient({
      region,
      credentials: awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN }),
    });
  }
  return new DynamoDBClient({ region });
};

/**
 * Create the table with the app's key schema when it doesn't exist. For
 * DynamoDB Local (dev, tests, e2e); the AWS tables are deployed by `infra/`.
 */
export const ensureTable = async (client: DynamoDBClient, tableName: string): Promise<void> => {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
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
  } catch (error) {
    if (!(error instanceof ResourceInUseException)) throw error;
  }
  await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: tableName });
};
