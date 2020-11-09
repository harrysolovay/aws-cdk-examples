import * as cdk from "@aws-cdk/core";
import { MyCustomResource } from "./my-custom-resource";
import { C$ } from "@crosshatch/cdk";

const MyStack = C$(
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

const App = C$(cdk.App, (def) => {
  def`CustomResourceDemoStack`(MyStack);
})

new App().synth();
