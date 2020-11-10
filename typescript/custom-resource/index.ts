import * as cdk from "@aws-cdk/core";
import { MyCustomResource } from "./my-custom-resource";
import { C8 } from "c8-concept";

const MyStack = C8(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const resource = def`DemoResource`(MyCustomResource, {
      message: "CustomResource says hello",
    });

    def`ResponseMessage`(cdk.CfnOutput, {
      description: "The message that came back from the Custom Resource",
      value: resource.response,
    });
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`CustomResourceDemoStack`(MyStack);
});

new App().synth();
