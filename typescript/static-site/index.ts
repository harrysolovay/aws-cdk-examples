#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { StaticSite } from "./static-site";
import { C$ } from "@crosshatch/cdk";

const MyStaticSiteStack = C$(cdk.Stack, (def, _props: cdk.StackProps) => {
    def`StaticSite`(StaticSite, {
        domainName: def.scope.node.tryGetContext("domain"),
        siteSubDomain: def.scope.node.tryGetContext("subdomain"),
    });
}, (props) => props);

const App = C$(cdk.App, (def) => {
  def`MyStaticSite`(MyStaticSiteStack, {
    env: {
      region: "us-east-1",
    },
  });
});

new App().synth();
