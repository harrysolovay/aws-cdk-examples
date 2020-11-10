#!/usr/bin/env node
import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as elb from "@aws-cdk/aws-elasticloadbalancing";
import * as cdk from "@aws-cdk/core";
import { C8 } from "c8-concept";

const LoadBalancerStack = C8(cdk.Stack, (def) => {
  const vpc = def`VPC`(ec2.Vpc);

  const asg = def`ASG`(autoscaling.AutoScalingGroup, {
    vpc,
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T2,
      ec2.InstanceSize.MICRO
    ),
    machineImage: new ec2.AmazonLinuxImage(),
  });

  const lb = def`LB`(elb.LoadBalancer, {
    vpc,
    internetFacing: true,
    healthCheck: {
      port: 80,
    },
  });

  lb.addTarget(asg);
  const listener = lb.addListener({ externalPort: 80 });

  listener.connections.allowDefaultPortFromAnyIpv4("Open to the world");
});

const App = C8(cdk.App, (def) => {
  def`LoadBalancerStack`(LoadBalancerStack);
});

new App().synth();
