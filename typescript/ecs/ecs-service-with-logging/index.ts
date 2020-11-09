import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as cdk from "@aws-cdk/core";
import { C$ } from "@crosshatch/cdk";

const WillkommenECS = C$(
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

    // create a task definition with CloudWatch Logs
    const logging = new ecs.AwsLogDriver({ streamPrefix: "myapp" });

    const taskDef = def`MyTaskDefinition`(ecs.Ec2TaskDefinition);
    taskDef.addContainer("AppContainer", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
      logging,
    });

    // Instantiate ECS Service with just cluster and image
    def`Ec2Service`(ecs.Ec2Service, {
      cluster,
      taskDefinition: taskDef,
    });
  },
  (props) => props
);

const App = C$(cdk.App, (def) => {
  def`Willkommen`(WillkommenECS);
})

new App().synth();
