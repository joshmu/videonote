import type { StackProps } from "aws-cdk-lib";
import type { VideonoteStackProps } from "./videonote-stack.ts";

type EnvironmentConfig = Omit<VideonoteStackProps, keyof StackProps>;

/**
 * DynamoDB's always-free tier is 25 RCU and 25 WCU of provisioned capacity
 * per region, shared by every table: prod 20, dev 2, 3 spare.
 */
export const environments = {
  VideonoteDev: {
    envName: "dev",
    readCapacity: 2,
    writeCapacity: 2,
    vercelEnvironments: ["preview", "development"],
    githubEnvironment: "dev",
    retainData: false,
  },
  VideonoteProd: {
    envName: "prod",
    readCapacity: 20,
    writeCapacity: 20,
    vercelEnvironments: ["production"],
    githubEnvironment: "prod",
    retainData: true,
    // Set to true once its cost is approved (well under $0.01/month at current size).
    pointInTimeRecovery: false,
    alarms: true,
  },
} satisfies Record<string, EnvironmentConfig>;
