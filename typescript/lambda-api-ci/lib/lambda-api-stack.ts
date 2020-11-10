import {
  LambdaIntegration,
  MethodLoggingLevel,
  RestApi,
} from "@aws-cdk/aws-apigateway";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { Function, Runtime, AssetCode } from "@aws-cdk/aws-lambda";
import { Duration, Stack, StackProps } from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import { C8 } from "c8-concept";

interface LambdaApiStackProps extends StackProps {
  functionName: string;
}

export const CDKExampleLambdaApiStack = C8(
  Stack,
  (def, props: LambdaApiStackProps) => {
    const bucket = def`WidgetStore`(s3.Bucket);

    const restApi = def`${def.scope.stackName}RestApi`(RestApi, {
      deployOptions: {
        stageName: "beta",
        metricsEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    const lambdaPolicy = new PolicyStatement();
    lambdaPolicy.addActions("s3:ListBucket");
    lambdaPolicy.addResources(bucket.bucketArn);

    const lambdaFunction = def`${props.functionName}`(Function, {
      functionName: props.functionName,
      handler: "handler.handler",
      runtime: Runtime.NODEJS_10_X,
      code: new AssetCode(`./src`),
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: {
        BUCKET: bucket.bucketName,
      },
      initialPolicy: [lambdaPolicy],
    });

    restApi.root.addMethod("GET", new LambdaIntegration(lambdaFunction, {}));
  },
  (props) => props
);
