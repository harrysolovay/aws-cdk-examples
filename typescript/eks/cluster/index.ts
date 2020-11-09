import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as iam from "@aws-cdk/aws-iam";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as eks from "@aws-cdk/aws-eks";
import * as cdk from "@aws-cdk/core";
import { C$ } from "@crosshatch/cdk";

const EKSCluster = C$(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const vpc = def`EKSVpc`(ec2.Vpc);

    // IAM role for our EC2 worker nodes
    const workerRole = def`EKSWorkerRole`(iam.Role, {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    const eksCluster = def`Cluster`(eks.Cluster, {
      vpc: vpc,
      kubectlEnabled: true, // we want to be able to manage k8s resources using CDK
      defaultCapacity: 0, // we want to manage capacity our selves
      version: eks.KubernetesVersion.V1_16,
    });

    const onDemandASG = def`OnDemandASG`(autoscaling.AutoScalingGroup, {
      vpc: vpc,
      role: workerRole,
      minCapacity: 1,
      maxCapacity: 10,
      instanceType: new ec2.InstanceType("t3.medium"),
      machineImage: new eks.EksOptimizedImage({
        kubernetesVersion: "1.14",
        nodeType: eks.NodeType.STANDARD, // without this, incorrect SSM parameter for AMI is resolved
      }),
      updateType: autoscaling.UpdateType.ROLLING_UPDATE,
    });

    eksCluster.connectAutoScalingGroupCapacity(onDemandASG, {});
  },
  (props) => props
);

const App = C$(cdk.App, (def) => {
  def`MyEKSCluster`(EKSCluster);
})

new App().synth();
