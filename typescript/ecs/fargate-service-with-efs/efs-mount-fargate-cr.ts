import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as cr from "@aws-cdk/custom-resources";
import * as fs from "fs";
import { C8 } from "c8-concept";

export interface FargateEfsCustomResourceProps {
  /**
   * Custom Resource Properties
   */
  TaskDefinition: string;
  EcsService: string;
  EcsCluster: string;
  EfsFileSystemId: string;
  EfsMountName: string;
}

export const FargateEfsCustomResource = C8(
  cdk.Construct,
  (def, props: FargateEfsCustomResourceProps) => {
    const onEvent = def`Singleton`(lambda.SingletonFunction, {
      uuid: "f7d4f730-4ee1-11e8-9c2d-fa7ae01bbebc",
      code: new lambda.InlineCode(
        fs.readFileSync("lambda.js", { encoding: "utf-8" })
      ),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.NODEJS_12_X,
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            "ecs:UpdateService",
            "ecs:RegisterTaskDefinition",
            "ecs:DescribeTaskDefinition",
            "iam:PassRole",
            "iam:GetRole",
          ],
          resources: ["*"],
        }),
      ],
    });

    const myProvider = def`MyProvider`(cr.Provider, {
      onEventHandler: onEvent,
    });

    const resource = def`Resource1`(cdk.CustomResource, {
      serviceToken: myProvider.serviceToken,
      properties: props,
    });

    const response = resource.getAtt("Response").toString();

    return { response } as const;
  }
);
