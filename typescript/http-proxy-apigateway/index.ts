import * as cdk from "@aws-cdk/core";
import { EndpointType } from "@aws-cdk/aws-apigateway";
import { C$ } from "@crosshatch/cdk";
import { Proxy } from "./proxy";

export const ProxyStack = C$(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const proxy = def`Proxy`(Proxy, {
      apiName: "HttpProxy",
      endpointType: EndpointType.EDGE,
    });
    proxy.addProxy("aws", "https://aws.amazon.com/ko");
  },
  (props) => props
);

const App = C$(cdk.App, (def) => {
  def`HttpProxy`(ProxyStack);
})

new App().synth();
