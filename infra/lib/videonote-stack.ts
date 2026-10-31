import {
  CfnOutput,
  DefaultStackSynthesizer,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

/** Published by the account foundation stack (repo `joshmu/aws-account`). */
export const OIDC_PROVIDER_ARN_PARAMS = {
  github: "/account/oidc/github/arn",
  vercel: "/account/oidc/vercel/arn",
} as const;

/** The account alerts topic (emails the account owner), from the same stack. */
export const ALERTS_TOPIC_ARN_PARAM = "/account/alerts/topic/arn";

/** Share of provisioned capacity that, held for 5 minutes, raises an alarm. */
export const CAPACITY_ALARM_RATIO = 0.8;

export const VERCEL_TEAM = "joshmu";
export const VERCEL_PROJECT = "videonote";
/** Repos that may deploy. The old repo stays until the new one has deployed both stacks. */
export const GITHUB_REPOS = ["joshmu/videonote", "joshmu/videonote-v2"];

const VERCEL_ISSUER = `oidc.vercel.com/${VERCEL_TEAM}`;
const VERCEL_AUDIENCE = `https://vercel.com/${VERCEL_TEAM}`;
const GITHUB_ISSUER = "token.actions.githubusercontent.com";
const GITHUB_AUDIENCE = "sts.amazonaws.com";

/** Item-level DynamoDB actions the app needs. No scans, no table management. */
export const TABLE_ACTIONS = [
  "dynamodb:GetItem",
  "dynamodb:PutItem",
  "dynamodb:UpdateItem",
  "dynamodb:DeleteItem",
  "dynamodb:Query",
  "dynamodb:BatchGetItem",
  "dynamodb:BatchWriteItem",
  "dynamodb:TransactWriteItems",
  "dynamodb:TransactGetItems",
  "dynamodb:ConditionCheckItem",
  "dynamodb:DescribeTable",
];

export type VercelEnvironment = "production" | "preview" | "development";

export interface VideonoteStackProps extends StackProps {
  /** Short environment name: table `videonote-<env>`, roles `videonote-<env>-*`. */
  readonly envName: "dev" | "prod";
  /** Provisioned capacity. No auto scaling: the free tier is 25 RCU / 25 WCU per region, shared. */
  readonly readCapacity: number;
  readonly writeCapacity: number;
  /** Vercel environments whose OIDC tokens may assume the runtime role. */
  readonly vercelEnvironments: VercelEnvironment[];
  /** GitHub environment whose OIDC tokens may assume the deploy role. */
  readonly githubEnvironment: string;
  /** Deletion protection on, and the table survives stack deletion. */
  readonly retainData: boolean;
  /**
   * Point-in-time recovery (continuous backups). Off until its cost is
   * approved; turning it on bills per GB-month of table size.
   * @default false
   */
  readonly pointInTimeRecovery?: boolean;
  /**
   * CloudWatch alarms on throttling and sustained high capacity, sent to the
   * account alerts topic. The free tier covers 10 alarms per account.
   * @default false
   */
  readonly alarms?: boolean;
}

/** One VideoNote environment: its table, the Vercel runtime role and the GitHub deploy role. */
export class VideonoteStack extends Stack {
  readonly table: dynamodb.Table;
  readonly vercelRole: iam.Role;
  readonly githubDeployRole: iam.Role;

  constructor(scope: Construct, id: string, props: VideonoteStackProps) {
    super(scope, id, props);

    const name = `videonote-${props.envName}`;

    this.table = new dynamodb.Table(this, "Table", {
      tableName: name,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: props.readCapacity,
      writeCapacity: props.writeCapacity,
      deletionProtection: props.retainData,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.pointInTimeRecovery ?? false,
      },
      removalPolicy: props.retainData ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Resolved by CloudFormation at deploy time (SSM parameter type), no lookup.
    const vercelProviderArn = ssm.StringParameter.valueForStringParameter(
      this,
      OIDC_PROVIDER_ARN_PARAMS.vercel,
    );
    const githubProviderArn = ssm.StringParameter.valueForStringParameter(
      this,
      OIDC_PROVIDER_ARN_PARAMS.github,
    );

    this.vercelRole = new iam.Role(this, "VercelRole", {
      roleName: `${name}-vercel`,
      description: `VideoNote functions on Vercel (${props.vercelEnvironments.join(", ")}) -> ${name}`,
      assumedBy: new iam.WebIdentityPrincipal(vercelProviderArn, {
        StringEquals: {
          [`${VERCEL_ISSUER}:aud`]: VERCEL_AUDIENCE,
          [`${VERCEL_ISSUER}:sub`]: props.vercelEnvironments.map(
            (env) => `owner:${VERCEL_TEAM}:project:${VERCEL_PROJECT}:environment:${env}`,
          ),
        },
      }),
    });
    this.vercelRole.addToPolicy(
      new iam.PolicyStatement({
        actions: TABLE_ACTIONS,
        resources: [this.table.tableArn],
      }),
    );

    const qualifier = DefaultStackSynthesizer.DEFAULT_QUALIFIER;
    this.githubDeployRole = new iam.Role(this, "GitHubDeployRole", {
      roleName: `${name}-github-deploy`,
      description: `GitHub Actions (${GITHUB_REPOS.join(", ")}, environment ${props.githubEnvironment}) -> CDK bootstrap roles`,
      assumedBy: new iam.WebIdentityPrincipal(githubProviderArn, {
        StringEquals: {
          [`${GITHUB_ISSUER}:aud`]: GITHUB_AUDIENCE,
          [`${GITHUB_ISSUER}:sub`]: GITHUB_REPOS.map(
            (repo) => `repo:${repo}:environment:${props.githubEnvironment}`,
          ),
        },
      }),
    });
    this.githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "AssumeCdkBootstrapRoles",
        actions: ["sts:AssumeRole"],
        resources: [
          `arn:${this.partition}:iam::${this.account}:role/cdk-${qualifier}-*-${this.account}-${this.region}`,
        ],
      }),
    );
    this.githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReadStacks",
        actions: ["cloudformation:DescribeStacks"],
        resources: ["*"],
      }),
    );

    if (props.alarms) this.addAlarms(name, props);

    new CfnOutput(this, "TableName", { value: this.table.tableName });
    new CfnOutput(this, "VercelRoleArn", { value: this.vercelRole.roleArn });
    new CfnOutput(this, "GitHubDeployRoleArn", { value: this.githubDeployRole.roleArn });
  }

  /**
   * Capacity is fixed (no auto scaling), so throttling is how this table
   * fails under load. Alert on any throttled request, and earlier on
   * consumption that stays near the provisioned limit.
   */
  private addAlarms(name: string, props: VideonoteStackProps) {
    const topicArn = ssm.StringParameter.valueForStringParameter(this, ALERTS_TOPIC_ARN_PARAM);
    const notify = new actions.SnsAction(sns.Topic.fromTopicArn(this, "AlertsTopic", topicArn));
    const alarm = (id: string, alarmProps: cloudwatch.AlarmProps) => {
      const created = new cloudwatch.Alarm(this, id, {
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        ...alarmProps,
      });
      created.addAlarmAction(notify);
      created.addOkAction(notify);
    };

    const fiveMinutes = { period: Duration.minutes(5), statistic: cloudwatch.Stats.SUM };
    alarm("ThrottleAlarm", {
      alarmName: `${name}-throttled`,
      alarmDescription: `${name} rejected requests for lack of provisioned capacity`,
      metric: new cloudwatch.MathExpression({
        expression: "FILL(reads, 0) + FILL(writes, 0)",
        usingMetrics: {
          reads: this.table.metric("ReadThrottleEvents", fiveMinutes),
          writes: this.table.metric("WriteThrottleEvents", fiveMinutes),
        },
        period: Duration.minutes(5),
        label: "Throttled requests",
      }),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
    });

    const perMinute = { period: Duration.minutes(1), statistic: cloudwatch.Stats.SUM };
    const capacity = [
      ["Read", props.readCapacity, this.table.metricConsumedReadCapacityUnits(perMinute)],
      ["Write", props.writeCapacity, this.table.metricConsumedWriteCapacityUnits(perMinute)],
    ] as const;
    for (const [kind, provisioned, consumed] of capacity) {
      alarm(`${kind}CapacityAlarm`, {
        alarmName: `${name}-${kind.toLowerCase()}-capacity-high`,
        alarmDescription: `${name} used over ${CAPACITY_ALARM_RATIO * 100}% of its ${provisioned} ${kind.toLowerCase()} capacity units for 5 minutes`,
        // Consumed units are summed per minute; divide for units per second.
        metric: new cloudwatch.MathExpression({
          expression: "consumed / 60",
          usingMetrics: { consumed },
          period: Duration.minutes(1),
          label: `${kind} capacity units per second`,
        }),
        threshold: provisioned * CAPACITY_ALARM_RATIO,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 5,
      });
    }
  }
}
