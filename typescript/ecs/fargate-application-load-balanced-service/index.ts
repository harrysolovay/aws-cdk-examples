import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as cdk from "@aws-cdk/core";
import { C$ } from "@crosshatch/cdk";

const BonjourFargate = C$(cdk.Stack, (def, _props?: cdk.StackProps) => {
  // Create VPC and Fargate Cluster
  // NOTE: Limit AZs to avoid reaching resource quotas
  const vpc = def`MyVpc`(ec2.Vpc, { maxAzs: 2 });
  const cluster = def`Cluster`(ecs.Cluster, { vpc });

  // Instantiate Fargate Service with just cluster and image
  def`FargateService`(ecs_patterns.ApplicationLoadBalancedFargateService, {
    cluster,
    taskImageOptions: {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
    },
  });
}, (props) => props);

const App = C$(cdk.App, (def) => {
  def`Bonjour`(BonjourFargate);
});

new App().synth();
