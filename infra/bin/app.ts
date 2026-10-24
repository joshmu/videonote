import { App, Tags } from "aws-cdk-lib";
import { environments } from "../lib/environments.ts";
import { VideonoteStack } from "../lib/videonote-stack.ts";

const app = new App();

for (const [stackName, config] of Object.entries(environments)) {
  // The account comes from the caller's credentials, never from the repo.
  const stack = new VideonoteStack(app, stackName, {
    ...config,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "ap-southeast-2" },
    description: `VideoNote ${config.envName}: DynamoDB table and OIDC roles for Vercel and GitHub Actions`,
    terminationProtection: config.retainData,
  });
  Tags.of(stack).add("project", "videonote");
  Tags.of(stack).add("environment", config.envName);
}
