#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AiDeveloperPortalPocStack } from "../lib/ai-developer-portal-poc-stack";
import { AiDeveloperPortalPocWebSocketStack } from "../lib/ai-developer-portal-poc-websocket-stack";
import { restAuthorizer } from "../lib/rest-authorizer";

const app = new cdk.App();

// 255431087816 - dil-team-pixel
// 891067072053 - acl-playground

new restAuthorizer(app, "restAuthorizer", {
  env: { account: "255431087816", region: "us-west-2" },
});

new AiDeveloperPortalPocWebSocketStack(
  app,
  "AiDeveloperPortalPocWebSocketStack",
  {
    env: { account: "255431087816", region: "us-west-2" },
  }
);

new AiDeveloperPortalPocStack(app, "AiDeveloperPortalPocStack", {
  env: { account: "255431087816", region: "us-west-2" },
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
