#!/usr/bin/env node
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cdk from "@aws-cdk/core";
import * as targets from "@aws-cdk/aws-route53-targets/lib";
import { Construct } from "@aws-cdk/core";
import { C$ } from "@crosshatch/cdk";

export interface StaticSiteProps {
  domainName: string;
  siteSubDomain: string;
}

export const StaticSite = C$(Construct, (def, props: StaticSiteProps) => {
  const zone = route53.HostedZone.fromLookup(def.scope, "Zone", {
    domainName: props.domainName,
  });

  const siteDomain = props.siteSubDomain + "." + props.domainName;

  def`Site`(cdk.CfnOutput, {
    value: "https://" + siteDomain,
  });

  const siteBucket = def`SiteBucket`(s3.Bucket, {
    bucketName: siteDomain,
    websiteIndexDocument: "index.html",
    websiteErrorDocument: "error.html",
    publicReadAccess: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  def`Bucket`(cdk.CfnOutput, { value: siteBucket.bucketName });

  // TLS certificate
  const certificateArn = def`SiteCertificate`(acm.DnsValidatedCertificate, {
    domainName: siteDomain,
    hostedZone: zone,
    region: "us-east-1",
  }).certificateArn;

  def`Certificate`(cdk.CfnOutput, {
    value: certificateArn,
  });

  const distribution = def`SiteDistribution`(
    cloudfront.CloudFrontWebDistribution,
    {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [siteDomain],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
        {
          customOriginSource: {
            domainName: siteBucket.bucketWebsiteDomainName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    }
  );

  def`DistributionId`(cdk.CfnOutput, {
    value: distribution.distributionId,
  });

  // Route53 alias record for the CloudFront distribution
  def`SiteAliasRecord`(route53.ARecord, {
    recordName: siteDomain,
    target: route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(distribution)
    ),
    zone,
  });

  // Deploy site contents to S3 bucket
  def`DeployWithInvalidation`(s3deploy.BucketDeployment, {
    sources: [s3deploy.Source.asset("./site-contents")],
    destinationBucket: siteBucket,
    distribution,
    distributionPaths: ["/*"],
  });
});
