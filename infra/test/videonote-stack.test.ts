import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { environments } from "../lib/environments.ts";
import { ALERTS_TOPIC_ARN_PARAM, TABLE_ACTIONS, VideonoteStack } from "../lib/videonote-stack.ts";

const ACCOUNT = "123456789012";

function synth(stackName: keyof typeof environments) {
  const stack = new VideonoteStack(new App(), stackName, {
    ...environments[stackName],
    env: { account: ACCOUNT, region: "ap-southeast-2" },
  });
  return Template.fromStack(stack);
}

const dev = synth("VideonoteDev");
const prod = synth("VideonoteProd");

function trustOf(template: Template, roleName: string) {
  const roles = template.findResources("AWS::IAM::Role", {
    Properties: { RoleName: roleName },
  });
  const [role] = Object.values(roles);
  expect(role, `role ${roleName}`).toBeDefined();
  const statements = role.Properties.AssumeRolePolicyDocument.Statement;
  expect(statements).toHaveLength(1);
  return statements[0];
}

function inlinePolicyFor(template: Template, roleLogicalIdPrefix: string) {
  const policies = template.findResources("AWS::IAM::Policy");
  const matches = Object.values(policies).filter((policy) =>
    policy.Properties.Roles.some((ref: { Ref: string }) => ref.Ref.startsWith(roleLogicalIdPrefix)),
  );
  expect(matches).toHaveLength(1);
  return matches[0].Properties.PolicyDocument.Statement;
}

describe.each([
  ["dev", dev, 2],
  ["prod", prod, 20],
] as const)("%s table", (env, template, capacity) => {
  it("is one provisioned PK/SK table with fixed capacity and no indexes", () => {
    template.resourceCountIs("AWS::DynamoDB::Table", 1);
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      TableName: `videonote-${env}`,
      BillingMode: Match.absent(),
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: capacity, WriteCapacityUnits: capacity },
      GlobalSecondaryIndexes: Match.absent(),
      LocalSecondaryIndexes: Match.absent(),
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: false },
    });
  });

  it("has no auto scaling", () => {
    template.resourceCountIs("AWS::ApplicationAutoScaling::ScalableTarget", 0);
    template.resourceCountIs("AWS::ApplicationAutoScaling::ScalingPolicy", 0);
  });

  it("outputs the table name and both role ARNs", () => {
    template.hasOutput("TableName", {});
    template.hasOutput("VercelRoleArn", {});
    template.hasOutput("GitHubDeployRoleArn", {});
  });
});

describe("retention", () => {
  it("retains prod data and protects it from deletion", () => {
    prod.hasResource("AWS::DynamoDB::Table", {
      DeletionPolicy: "Retain",
      UpdateReplacePolicy: "Retain",
      Properties: Match.objectLike({ DeletionProtectionEnabled: true }),
    });
  });

  it("lets the dev table be destroyed", () => {
    dev.hasResource("AWS::DynamoDB::Table", {
      DeletionPolicy: "Delete",
      Properties: Match.objectLike({ DeletionProtectionEnabled: false }),
    });
  });
});

describe("capacity budget", () => {
  it("fits the shared 25 RCU / 25 WCU free tier with 3 spare", () => {
    const configs = Object.values(environments);
    const read = configs.reduce((sum, c) => sum + c.readCapacity, 0);
    const write = configs.reduce((sum, c) => sum + c.writeCapacity, 0);
    expect(read).toBe(22);
    expect(write).toBe(22);
  });
});

describe("Vercel runtime role", () => {
  const sub = (env: string) => `owner:joshmu:project:videonote:environment:${env}`;

  it.each([
    ["dev", dev, [sub("preview"), sub("development")]],
    ["prod", prod, [sub("production")]],
  ] as const)("%s trusts only its Vercel environments", (env, template, expectedSub) => {
    const trust = trustOf(template, `videonote-${env}-vercel`);
    expect(trust.Action).toBe("sts:AssumeRoleWithWebIdentity");
    expect(trust.Principal.Federated).toEqual({ Ref: expect.stringMatching(/^SsmParameterValue/) });
    expect(trust.Condition).toEqual({
      StringEquals: {
        "oidc.vercel.com/joshmu:aud": "https://vercel.com/joshmu",
        "oidc.vercel.com/joshmu:sub": expectedSub,
      },
    });
  });

  it("prod does not trust preview or development tokens", () => {
    const trust = trustOf(prod, "videonote-prod-vercel");
    const subs = [trust.Condition.StringEquals["oidc.vercel.com/joshmu:sub"]].flat();
    expect(subs).toEqual([sub("production")]);
  });

  it.each([
    ["dev", dev],
    ["prod", prod],
  ] as const)("%s may use item-level actions on its own table only", (_env, template) => {
    const statements = inlinePolicyFor(template, "VercelRole");
    expect(statements).toHaveLength(1);
    const [statement] = statements;
    expect(statement.Effect).toBe("Allow");
    expect([...statement.Action].sort()).toEqual([...TABLE_ACTIONS].sort());
    expect(statement.Action).not.toContain("dynamodb:Scan");
    const [tableId] = Object.keys(template.findResources("AWS::DynamoDB::Table"));
    expect(statement.Resource).toEqual({ "Fn::GetAtt": [tableId, "Arn"] });
  });
});

describe("GitHub deploy role", () => {
  it.each([
    ["dev", dev],
    ["prod", prod],
  ] as const)("%s trusts only its GitHub environment", (env, template) => {
    const trust = trustOf(template, `videonote-${env}-github-deploy`);
    expect(trust.Action).toBe("sts:AssumeRoleWithWebIdentity");
    expect(trust.Condition).toEqual({
      StringEquals: {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": [
          `repo:joshmu/videonote:environment:${env}`,
          `repo:joshmu/videonote-v2:environment:${env}`,
        ],
      },
    });
  });

  it.each([
    ["dev", dev],
    ["prod", prod],
  ] as const)("%s may only assume the CDK bootstrap roles and read stacks", (_env, template) => {
    const statements = inlinePolicyFor(template, "GitHubDeployRole");
    expect(statements).toEqual([
      {
        Sid: "AssumeCdkBootstrapRoles",
        Effect: "Allow",
        Action: "sts:AssumeRole",
        Resource: {
          "Fn::Join": [
            "",
            [
              "arn:",
              { Ref: "AWS::Partition" },
              `:iam::${ACCOUNT}:role/cdk-hnb659fds-*-${ACCOUNT}-ap-southeast-2`,
            ],
          ],
        },
      },
      {
        Sid: "ReadStacks",
        Effect: "Allow",
        Action: "cloudformation:DescribeStacks",
        Resource: "*",
      },
    ]);
  });
});

describe("alarms", () => {
  const alarms = Object.values(prod.findResources("AWS::CloudWatch::Alarm"));
  const named = (name: string) => {
    const match = alarms.find((alarm) => alarm.Properties.AlarmName === name);
    expect(match, `alarm ${name}`).toBeDefined();
    return match!.Properties;
  };

  it("dev has none", () => {
    dev.resourceCountIs("AWS::CloudWatch::Alarm", 0);
  });

  it("prod alarms on throttling and on read and write capacity", () => {
    expect(alarms.map((alarm) => alarm.Properties.AlarmName).sort()).toEqual([
      "videonote-prod-read-capacity-high",
      "videonote-prod-throttled",
      "videonote-prod-write-capacity-high",
    ]);
  });

  it("raises on the first throttled read or write in 5 minutes", () => {
    const alarm = named("videonote-prod-throttled");
    expect(alarm).toMatchObject({
      Threshold: 0,
      ComparisonOperator: "GreaterThanThreshold",
      EvaluationPeriods: 1,
      TreatMissingData: "notBreaching",
    });
    const metricNames = alarm.Metrics.flatMap(
      (query: { MetricStat?: { Metric: { MetricName: string } } }) =>
        query.MetricStat ? [query.MetricStat.Metric.MetricName] : [],
    );
    expect(metricNames.sort()).toEqual(["ReadThrottleEvents", "WriteThrottleEvents"]);
  });

  it.each(["read", "write"])(
    "raises when %s use stays above 16 of its 20 units per second for 5 minutes",
    (kind) => {
      expect(named(`videonote-prod-${kind}-capacity-high`)).toMatchObject({
        Threshold: 16,
        ComparisonOperator: "GreaterThanThreshold",
        EvaluationPeriods: 5,
        TreatMissingData: "notBreaching",
      });
    },
  );

  it("notifies the account alerts topic when raised and when cleared", () => {
    const params = prod.findParameters("*", { Default: ALERTS_TOPIC_ARN_PARAM });
    const [param] = Object.keys(params);
    expect(param, "alerts topic SSM parameter").toBeDefined();
    for (const alarm of alarms) {
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: param }]);
      expect(alarm.Properties.OKActions).toEqual([{ Ref: param }]);
    }
  });
});
