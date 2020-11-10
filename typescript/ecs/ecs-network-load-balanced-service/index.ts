import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as cdk from "@aws-cdk/core";
import { C8 } from "c8-concept";

const EPHEMERAL_PORT_RANGE = ec2.Port.tcpRange(32768, 65535);

const BonjourECS = C8(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const vpc = def`MyVpc`(ec2.Vpc, { maxAzs: 2 });
    const cluster = def`Ec2Cluster`(ecs.Cluster, { vpc });
    cluster.addCapacity("DefaultAutoScalingGroup", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
    });

    const ecsService = def`Ec2Service`(
      ecs_patterns.NetworkLoadBalancedEc2Service,
      {
        cluster,
        memoryLimitMiB: 512,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        },
      }
    );

    ecsService.service.connections.allowFromAnyIpv4(EPHEMERAL_PORT_RANGE);
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`Bonjour`(BonjourECS);
});

new App().synth();
