import { afterEach, describe, expect, it, vi } from "vitest";

import { dynamoClientFromEnv } from "@/utils/store/dynamoClient";

const getOidcToken = vi.hoisted(() => vi.fn(async () => "oidc-token"));
vi.mock("@vercel/oidc-aws-credentials-provider", () => ({
  awsCredentialsProvider:
    ({ roleArn }: { roleArn: string }) =>
    async () => {
      await getOidcToken();
      return { accessKeyId: `assumed:${roleArn}`, secretAccessKey: "x" };
    },
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

const credentialsOf = async (client: ReturnType<typeof dynamoClientFromEnv>) =>
  client.config.credentials();

describe("dynamoClientFromEnv", () => {
  it("assumes AWS_ROLE_ARN through Vercel OIDC whenever it is set, VERCEL or not", async () => {
    vi.stubEnv("AWS_ROLE_ARN", "arn:aws:iam::123456789012:role/videonote-dev-vercel");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("DYNAMODB_ENDPOINT", "");

    const credentials = await credentialsOf(dynamoClientFromEnv());

    expect(credentials.accessKeyId).toBe(
      "assumed:arn:aws:iam::123456789012:role/videonote-dev-vercel",
    );
    expect(getOidcToken).toHaveBeenCalled();
  });

  it("uses placeholder credentials for DynamoDB Local", async () => {
    vi.stubEnv("DYNAMODB_ENDPOINT", "http://localhost:8000");
    vi.stubEnv("AWS_ROLE_ARN", "arn:aws:iam::123456789012:role/ignored");

    const client = dynamoClientFromEnv();

    expect((await credentialsOf(client)).accessKeyId).toBe("local");
    expect(await client.config.endpoint?.()).toMatchObject({ hostname: "localhost", port: 8000 });
  });
});
