#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { WidgetService } from "./widget_service";
import { C8 } from "c8-concept";

const MyWidgetServiceStack = C8(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    def`Widgets`(WidgetService);
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`MyWidgetServiceStack`(MyWidgetServiceStack);
});

new App().synth();
