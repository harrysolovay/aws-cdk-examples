#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CDKExampleLambdaApiStack } from "../lib/lambda-api-stack";
import { C8 } from "c8-concept";

export const lambdaApiStackName = "CDKExampleLambdaApiStack";
export const lambdaFunctionName = "CDKExampleWidgetStoreFunction";

const App = C8(cdk.App, (def) => {
  def`${lambdaApiStackName}`(CDKExampleLambdaApiStack, {
    functionName: lambdaFunctionName,
  });
});

new App().synth();
