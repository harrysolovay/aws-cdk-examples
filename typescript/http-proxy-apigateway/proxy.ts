import { Construct, CfnOutput } from "@aws-cdk/core";
import * as apiGateway from "@aws-cdk/aws-apigateway";
import { C8 } from "c8-concept";

export interface ProxyProps {
  readonly apiName: string;
  readonly endpointType: apiGateway.EndpointType;
}

export const Proxy = C8(Construct, (def, props: ProxyProps) => {
  const api = def`API`(apiGateway.RestApi, {
    restApiName: props.apiName,
    endpointConfiguration: {
      types: [props.endpointType],
    },
  });

  return {
    api,
    addProxy(id: string, baseUrl: string, method: string = "GET") {
      const namespace = api.root.addResource(id);
      const proxyResource = def`ProxyResource${method}${id}`(
        apiGateway.ProxyResource,
        {
          parent: namespace,
          anyMethod: false,
        }
      );

      proxyResource.addMethod(
        method,
        new apiGateway.HttpIntegration(`${baseUrl}/{proxy}`, {
          proxy: true,
          httpMethod: method,
          options: {
            requestParameters: {
              "integration.request.path.proxy": "method.request.path.proxy",
            },
          },
        }),
        {
          requestParameters: {
            "method.request.path.proxy": true,
          },
        }
      );

      def`EndPoint${method}${id}`(CfnOutput, {
        value: api.urlForPath(proxyResource.path),
      });
    },
  } as const;
});
