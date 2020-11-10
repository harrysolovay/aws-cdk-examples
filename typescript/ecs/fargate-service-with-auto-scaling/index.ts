import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk from "@aws-cdk/core";
import { C8 } from "c8-concept";

const AutoScalingFargateService = C8(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const vpc = def`Vpc`(ec2.Vpc, { maxAzs: 2 });

    const cluster = def`fargate-service-autoscaling`(ecs.Cluster, { vpc });

    const fargateService = def`sample-app`(
      ecs_patterns.NetworkLoadBalancedFargateService,
      {
        cluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        },
      }
    );

    const scaling = fargateService.service.autoScaleTaskCount({
      maxCapacity: 2,
    });

    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    def`LoadBalancerDNS`(cdk.CfnOutput, {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`aws-fargate-application-autoscaling`(AutoScalingFargateService);
});

new App().synth();
