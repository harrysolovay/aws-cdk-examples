import * as cdk from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import { C$ } from "@crosshatch/cdk";

export const WidgetService = C$(cdk.Construct, (def) => {
  const bucket = def`WidgetStore`(s3.Bucket, {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  const handler = def`WidgetHandler`(lambda.Function, {
    runtime: lambda.Runtime.NODEJS_10_X,
    code: lambda.AssetCode.asset("resources"),
    handler: "widgets.main",
    environment: {
      BUCKET: bucket.bucketName,
    },
  });

  bucket.grantReadWrite(handler);

  const api = def`widgets-api`(apigateway.RestApi, {
    restApiName: "Widget Service",
    description: "This service serves widgets.",
  });

  const getWidgetsIntegration = new apigateway.LambdaIntegration(handler, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' },
  });

  api.root.addMethod("GET", getWidgetsIntegration);

  const widget = api.root.addResource("{id}");

  const postWidgetIntegration = new apigateway.LambdaIntegration(handler);
  const getWidgetIntegration = new apigateway.LambdaIntegration(handler);
  const deleteWidgetIntegration = new apigateway.LambdaIntegration(handler);

  widget.addMethod("POST", postWidgetIntegration);
  widget.addMethod("GET", getWidgetIntegration);
  widget.addMethod("DELETE", deleteWidgetIntegration);
});
