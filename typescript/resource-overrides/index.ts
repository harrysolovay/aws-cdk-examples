import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import * as assert from "assert";
import { C$ } from "@crosshatch/cdk";

const ResourceOverridesExample = C$(cdk.Stack, (def) => {
  const otherBucket = def`Other`(s3.Bucket);

  const bucket = def`MyBucket`(s3.Bucket, {
    versioned: true,
    encryption: s3.BucketEncryption.KMS_MANAGED,
  });

  const bucketResource2 = bucket.node.defaultChild as s3.CfnBucket;
  bucketResource2.addPropertyOverride(
    "BucketEncryption.ServerSideEncryptionConfiguration.0.EncryptEverythingAndAlways",
    true
  );
  bucketResource2.addPropertyDeletionOverride(
    "BucketEncryption.ServerSideEncryptionConfiguration.0.ServerSideEncryptionByDefault"
  );

  const bucketResource = bucket.node.defaultChild as s3.CfnBucket;
  const anotherWay = bucket.node.children.find(
    (c) => (c as cdk.CfnResource).cfnResourceType === "AWS::S3::Bucket"
  ) as s3.CfnBucket;
  assert.equal(bucketResource, anotherWay);

  bucketResource.node.addDependency(
    otherBucket.node.defaultChild as cdk.CfnResource
  );
  bucketResource.cfnOptions.metadata = { MetadataKey: "MetadataValue" };
  bucketResource.cfnOptions.updatePolicy = {
    autoScalingRollingUpdate: {
      pauseTime: "390",
    },
  };

  bucketResource.addOverride("Type", "AWS::S3::Bucketeer");
  bucketResource.addOverride("Transform", "Boom");
  bucketResource.addOverride("Properties.CorsConfiguration", {
    Custom: 123,
    Bar: ["A", "B"],
  });

  bucketResource.addPropertyOverride(
    "VersioningConfiguration.Status",
    "NewStatus"
  );
  bucketResource.addPropertyOverride("Token", otherBucket.bucketArn);
  bucketResource.addPropertyOverride(
    "LoggingConfiguration.DestinationBucketName",
    otherBucket.bucketName
  );

  bucketResource.analyticsConfigurations = [
    {
      id: "config1",
      storageClassAnalysis: {
        dataExport: {
          outputSchemaVersion: "1",
          destination: {
            format: "html",
            bucketArn: otherBucket.bucketArn, // use tokens freely
          },
        },
      },
    },
  ];

  bucketResource.addPropertyOverride("CorsConfiguration.CorsRules", [
    {
      AllowedMethods: ["GET"],
      AllowedOrigins: ["*"],
    },
  ]);

  bucketResource.addDeletionOverride("Metadata");
  bucketResource.addPropertyDeletionOverride("CorsConfiguration.Bar");

  const vpc = def`VPC`(ec2.Vpc, { maxAzs: 1 });
  const asg = def`ASG`(autoscaling.AutoScalingGroup, {
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.M4,
      ec2.InstanceSize.XLARGE
    ),
    machineImage: new ec2.AmazonLinuxImage(),
    vpc,
  });

  const lc = asg.node.findChild(
    "LaunchConfig"
  ) as autoscaling.CfnLaunchConfiguration;
  lc.addPropertyOverride("Foo.Bar", "Hello");
});

const App = C$(cdk.App, (def) => {
  def`resource-overrides`(ResourceOverridesExample);
});

new App().synth();
