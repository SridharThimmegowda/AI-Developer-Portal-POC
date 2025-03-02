import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";

export class AiDeveloperPortalPocWebSocketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Create the Lambda function
    const claudeMigration = new lambda.Function(
      this,
      "developerPortalPOCMigrationLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        functionName: "developer-portal-poc-migration-lambda",
        code: lambda.Code.fromAsset("./lib/src-claude-websocket"), // Assumes the lambda code is in the 'lambda' directory
        handler: "claude.handler",
        memorySize: 512,
        timeout: cdk.Duration.minutes(15),
        description:
          "developer portal poc to migrate inspirations and scripthub lambda function",
      }
    );

    // Create the WebSocket API
    const webSocketApi = new apigatewayv2.WebSocketApi(
      this,
      "DevPortalMigrationWebSocketApi",
      {
        apiName: "developer-portal-poc-migration-websocket-api",
        description:
          "Developer Portal WebSocket API for developer portal POC Migration",
        defaultRouteOptions: {
          integration: new integrations.WebSocketLambdaIntegration(
            "ClaudeMigrationIntegration",
            claudeMigration
          ),
        },
      }
    );

    // Create a WebSocket stage
    new apigatewayv2.WebSocketStage(this, "DevPortalPOCWebSocketStage", {
      webSocketApi,
      stageName: "dev",
      autoDeploy: true,
    });

    // Grant the Lambda functions permissions to manage WebSocket connections
    const policyStatement = new iam.PolicyStatement({
      actions: ["execute-api:ManageConnections"],
      resources: [webSocketApi.arnForExecuteApi()],
    });

    claudeMigration.addToRolePolicy(policyStatement);

    // Grant the Lambda function permissions to invoke the Bedrock model
    const bedrockPolicyStatement = new iam.PolicyStatement({
      actions: ["bedrock:InvokeModel"],
      resources: [
        "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-opus-20240229-v1:0",
      ],
    });

    claudeMigration.addToRolePolicy(bedrockPolicyStatement);

    // Stack Output
    new cdk.CfnOutput(this, "WebSocketApiEndpoint", {
      value: webSocketApi.apiEndpoint,
    });
  }
}
