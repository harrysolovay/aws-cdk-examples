#!/usr/bin/env node
import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import * as cdk from "@aws-cdk/core";
import { C$ } from "@crosshatch/cdk";

const LoadBalancerStack = C$(cdk.Stack, (def) => {
  const vpc = def`VPC`(ec2.Vpc);

  const asg = def`ASG`(autoscaling.AutoScalingGroup, {
    vpc,
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T2,
      ec2.InstanceSize.MICRO
    ),
    machineImage: new ec2.AmazonLinuxImage(),
  });

  const lb = def`LB`(elbv2.ApplicationLoadBalancer, {
    vpc,
    internetFacing: true,
  });

  const listener = lb.addListener("Listener", {
    port: 80,
  });

  listener.addTargets("Target", {
    port: 80,
    targets: [asg],
  });

  listener.connections.allowDefaultPortFromAnyIpv4("Open to the world");

  asg.scaleOnRequestCount("AModestLoad", {
    targetRequestsPerSecond: 1,
  });
});

const App = C$(cdk.App, (def) => {
  def`LoadBalancerStack`(LoadBalancerStack);
});

new App().synth();
