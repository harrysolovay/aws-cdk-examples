#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CIStack } from "../lib/ci-stack";
import { C8 } from "c8-concept";

const App = C8(cdk.App, (def) => {
  def`CDKExampleLambdaApiCIStack`(CIStack, {
    repositoryName: "lambda-api-ci",
  });
});

new App().synth();
