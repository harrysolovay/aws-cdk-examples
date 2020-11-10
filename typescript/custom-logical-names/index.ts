#!/usr/bin/env node
import { BaseStack } from "./base-stack";
import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as sns from "@aws-cdk/aws-sns";
import { C8 } from "c8-concept";

const MyStack = C8(
  BaseStack,
  (def, _props?: cdk.StackProps) => {
    def`MyTopic`(sns.Topic);
    def`MyBucket`(s3.Bucket);
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`MyStack`(MyStack);
});

new App().synth();
