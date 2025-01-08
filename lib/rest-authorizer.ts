import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class restAuthorizer extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Lambda function
    const authorizerLambda = new lambda.Function(
      this,
      "developerPortalPOCAuthorizerLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        functionName: "developerPortalPOCAuthorizerRestLambda",
        code: lambda.Code.fromAsset("./lib/rest-authorizer"), // Assumes the lambda code is in the 'lambda' directory
        handler: "authorizer.handler",
        memorySize: 256,
        timeout: cdk.Duration.seconds(300),
        description: "developer portal POC authorization lambda function",
      }
    );
  }
}
