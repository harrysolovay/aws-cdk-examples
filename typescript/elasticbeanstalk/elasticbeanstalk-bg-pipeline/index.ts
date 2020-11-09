import * as cdk from "@aws-cdk/core";
import * as cpactions from "@aws-cdk/aws-codepipeline-actions";
import * as cp from "@aws-cdk/aws-codepipeline";
import * as cc from "@aws-cdk/aws-codecommit";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import { C$ } from "@crosshatch/cdk";

export const CdkStack = C$(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const node = def.scope.node;

    const blue_env = node.tryGetContext("blue_env");
    const green_env = node.tryGetContext("green_env");
    const app_name = node.tryGetContext("app_name");

    const bucket = def`BlueGreenBucket`(s3.Bucket, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const handler = def`BlueGreenLambda`(lambda.Function, {
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.asset("resources"),
      handler: "blue_green.lambda_handler",
      environment: {
        BUCKET: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(handler);

    const repo = def`Repository`(cc.Repository, {
      repositoryName: "MyRepositoryName",
    });

    const pipeline = def`MyFirstPipeline`(cp.Pipeline);

    const sourceStage = pipeline.addStage({ stageName: "Source" });

    const sourceArtifact = new cp.Artifact("Source");

    const sourceAction = new cpactions.CodeCommitSourceAction({
      actionName: "CodeCommit",
      repository: repo,
      output: sourceArtifact,
    });

    sourceStage.addAction(sourceAction);

    const deployStage = pipeline.addStage({
      stageName: "Deploy",
    });

    const lambdaAction = new cpactions.LambdaInvokeAction({
      actionName: "InvokeAction",
      lambda: handler,
      userParameters: {
        blueEnvironment: blue_env,
        greenEnvironment: green_env,
        application: app_name,
      },
      inputs: [sourceArtifact],
    });

    deployStage.addAction(lambdaAction);
  },
  (props) => props
);

const App = C$(cdk.App, (def) => {
  def`ElasticBeanstalkBG`(CdkStack);
})

new App().synth();
