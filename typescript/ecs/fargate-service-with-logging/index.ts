import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as cdk from "@aws-cdk/core";
import {C$} from "@crosshatch/cdk";

const WillkommenFargate = C$(cdk.Stack, (def, _props?: cdk.StackProps) => {
  const vpc = def`MyVpc`(ec2.Vpc, { maxAzs: 2 });
  const cluster = def`Ec2Cluster`(ecs.Cluster, { vpc });

  // create a task definition with CloudWatch Logs
  const logging = new ecs.AwsLogDriver({
    streamPrefix: "myapp",
  });

  const taskDef = def`MyTaskDefinition`(ecs.FargateTaskDefinition, {
    memoryLimitMiB: 512,
    cpu: 256,
  });

  taskDef.addContainer("AppContainer", {
    image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
    logging,
  });

  // Instantiate ECS Service with just cluster and image
  def`FargateService`(ecs.FargateService, {
    cluster,
    taskDefinition: taskDef,
  });
}, (props) => props);

const App = C$(cdk.App, (def) => {
  def`Willkommen`(WillkommenFargate);
})

new App().synth();
