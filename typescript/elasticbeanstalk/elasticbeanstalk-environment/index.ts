#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import * as elasticbeanstalk from "@aws-cdk/aws-elasticbeanstalk";
import { C$ } from "@crosshatch/cdk";

const CdkStack = C$(cdk.Stack, (def, _props?: cdk.StackProps) => {
  const node = def.scope.node;

  const appName = "MyApp";

  const platform = node.tryGetContext("platform");

  const app = def`Application`(elasticbeanstalk.CfnApplication, {
    applicationName: appName,
  });

  const env = def`Environment`(elasticbeanstalk.CfnEnvironment, {
    environmentName: "MySampleEnvironment",
    applicationName: app.applicationName || appName,
    platformArn: platform,
  });

  env.addDependsOn(app);
}, (props) => props);

const App = C$(cdk.App, (def) => {
  def`ElasticBeanstalk`(CdkStack);
});

new App().synth();
