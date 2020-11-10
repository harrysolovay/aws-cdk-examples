import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as cdk from "@aws-cdk/core";
import { C8 } from "c8-concept";

const ECSCluster = C8(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const vpc = def`MyVpc`(ec2.Vpc, { maxAzs: 2 });

    const asg = def`MyFleet`(autoscaling.AutoScalingGroup, {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.XLARGE
      ),
      machineImage: new ecs.EcsOptimizedAmi(),
      updateType: autoscaling.UpdateType.REPLACING_UPDATE,
      desiredCapacity: 3,
      vpc,
    });

    const cluster = def`EcsCluster`(ecs.Cluster, { vpc });

    cluster.addAutoScalingGroup(asg);
    cluster.addCapacity("DefaultAutoScalingGroup", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
    });
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`MyFirstEcsCluster`(ECSCluster);
});

new App().synth();
