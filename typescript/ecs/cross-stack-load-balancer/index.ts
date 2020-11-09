import * as ecs from "@aws-cdk/aws-ecs";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as cdk from "@aws-cdk/core";
import {
  SplitAtListener_LoadBalancerStack,
  SplitAtListener_ServiceStack,
} from "./split-at-listener";
import {
  SplitAtTargetGroup_LoadBalancerStack,
  SplitAtTargetGroup_ServiceStack,
} from "./split-at-targetgroup";
import { C$ } from "@crosshatch/cdk";

const SharedInfraStack = C$(cdk.Stack, (def, _props?: cdk.StackProps) => {
  const vpc = def`Vpc`(ec2.Vpc, { maxAzs: 2 });
  const cluster = def`Cluster`(ecs.Cluster, { vpc });
  return { vpc, cluster } as const;
}, (props) => props);

const App = C$(cdk.App, (def) => {
  const infra = def`CrossStackLBInfra`(SharedInfraStack);

  const splitAtListenerLBStack = def`SplitAtListener-LBStack`(
    SplitAtListener_LoadBalancerStack,
    {
      vpc: infra.vpc,
    }
  );

  def`SplitAtListener-ServiceStack`(SplitAtListener_ServiceStack, {
    cluster: infra.cluster,
    vpc: infra.vpc,
    loadBalancer: splitAtListenerLBStack.loadBalancer,
  });

  const splitAtTargetGroupLBStack = def`SplitAtTargetGroup-LBStack`(
    SplitAtTargetGroup_LoadBalancerStack,
    {
      vpc: infra.vpc,
    }
  );

  def`SplitAtTargetGroup-ServiceStack`(SplitAtTargetGroup_ServiceStack, {
    cluster: infra.cluster,
    vpc: infra.vpc,
    targetGroup: splitAtTargetGroupLBStack.targetGroup,
  });
});

new App().synth();
