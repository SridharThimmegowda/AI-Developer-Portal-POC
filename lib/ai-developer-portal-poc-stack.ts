import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from "aws-cdk-lib/aws-lambda";
// import { ApiGatewayToLambda } from '@aws-solutions-constructs/aws-apigateway-lambda';
import * as iam from "aws-cdk-lib/aws-iam"; // Add this line to import the 'iam' module
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";

export class AiDeveloperPortalPocStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Create the Lambda function
    const claudeInspirationsMigration = new lambda.Function(
      this,
      "developerPortalPOCInspirationsMigrationLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        functionName: "developer-portal-poc-inspirations-migration-lambda",
        code: lambda.Code.fromAsset("./lib/src-claude"), // Assumes the lambda code is in the 'lambda' directory
        handler: "claude.handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(300),
        description:
          "developer portal poc to migrate inspirations to ideashub lambda function",
      }
    );

    // Assuming lambdaFunction is your Lambda function object
    claudeInspirationsMigration.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")
    );

    // Import the existing authorizer Lambda function
    // 255431087816 - dil-team-pixel
    // 891067072053 - acl-playground
    const authorizerLambda: lambda.IFunction = lambda.Function.fromFunctionArn(
      this,
      "developerPortalPOCAuthorizerLambda",
      "arn:aws:lambda:us-west-2:255431087816:function:developerPortalPOCAuthorizerRestLambda"
    );

    const authorizer = new apigateway.TokenAuthorizer(this, "Authorizer", {
      handler: authorizerLambda,
    });

    const restApi = new apigateway.RestApi(this, "HttpApi", {
      restApiName:
        "developer-portal-poc-inspirations-migration-api-gateway-rest-api",
      description:
        "developer portal POC API Gateway for migrating inspirations to ideashub",
    });

    const claudelambdaIntegration = new apigateway.LambdaIntegration(
      claudeInspirationsMigration
    );

    restApi.root.addMethod("POST", claudelambdaIntegration, {
      authorizer: authorizer,
    });
  }
}
