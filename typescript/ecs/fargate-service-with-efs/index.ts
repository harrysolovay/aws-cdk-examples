import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as efs from "@aws-cdk/aws-efs";
import * as cr from "@aws-cdk/custom-resources";
import { FargateEfsCustomResource } from "./efs-mount-fargate-cr";
import { C$ } from "@crosshatch/cdk";

const FargateEfs = C$(cdk.Stack, (def, _props?: cdk.StackProps) => {
  const vpc = def`DefaultVpc`(ec2.Vpc, { maxAzs: 2 });
  const ecsCluster = def`DefaultEcsCluster`(ecs.Cluster, { vpc: vpc });

  const fileSystem = def`MyEfsFileSystem`(efs.FileSystem, {
    vpc: vpc,
    encrypted: true,
    lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
    performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
    throughputMode: efs.ThroughputMode.BURSTING,
  });

  const params = {
    FileSystemId: fileSystem.fileSystemId,
    PosixUser: {
      Gid: 1000,
      Uid: 1000,
    },
    RootDirectory: {
      CreationInfo: {
        OwnerGid: 1000,
        OwnerUid: 1000,
        Permissions: "755",
      },
      Path: "/uploads",
    },
    Tags: [
      {
        Key: "Name",
        Value: "ecsuploads",
      },
    ],
  };

  const efsAccessPoint = def`EfsAccessPoint`(cr.AwsCustomResource, {
    onUpdate: {
      service: "EFS",
      action: "createAccessPoint",
      parameters: params,
      physicalResourceId: cr.PhysicalResourceId.of("12121212121"),
    },
    policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
      resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
    }),
  });

  efsAccessPoint.node.addDependency(fileSystem);

  const taskDef = def`MyTaskDefinition`(ecs.FargateTaskDefinition, {
    memoryLimitMiB: 512,
    cpu: 256,
  });

  const containerDef = def`MyContainerDefinition`(ecs.ContainerDefinition, {
    image: ecs.ContainerImage.fromRegistry("coderaiser/cloudcmd"),
    taskDefinition: taskDef,
  });

  containerDef.addPortMappings({
    containerPort: 8000,
  });

  const albFargateService = def`Service01`(
    ecs_patterns.ApplicationLoadBalancedFargateService,
    {
      cluster: ecsCluster,
      taskDefinition: taskDef,
      desiredCount: 2,
    }
  );

  albFargateService.targetGroup.setAttribute(
    "deregistration_delay.timeout_seconds",
    "30"
  );

  // Override Platform version (until Latest = 1.4.0)
  const albFargateServiceResource = albFargateService.service.node.findChild(
    "Service"
  ) as ecs.CfnService;
  albFargateServiceResource.addPropertyOverride("PlatformVersion", "1.4.0");

  // Allow access to EFS from Fargate ECS
  fileSystem.connections.allowDefaultPortFrom(
    albFargateService.service.connections
  );

  //Custom Resource to add EFS Mount to Task Definition
  const resource = def`FargateEfsCustomResource`(FargateEfsCustomResource, {
    TaskDefinition: taskDef.taskDefinitionArn,
    EcsService: albFargateService.service.serviceName,
    EcsCluster: ecsCluster.clusterName,
    EfsFileSystemId: fileSystem.fileSystemId,
    EfsMountName: "uploads",
  });

  resource.node.addDependency(albFargateService);
}, (props) => props);

const App = C$(cdk.App, (def) => {
  def`FargateEfsDemo01`(FargateEfs);
});

new App().synth();
