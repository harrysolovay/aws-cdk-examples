#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { WidgetService } from "./widget_service";
import { C$ } from "@crosshatch/cdk";

const MyWidgetServiceStack = C$(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    def`Widgets`(WidgetService);
  },
  (props) => props
);

const App = C$(cdk.App, (def) => {
  def`MyWidgetServiceStack`(MyWidgetServiceStack);
});

new App().synth();
