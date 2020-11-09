import {
  LambdaRestApi,
  CfnAuthorizer,
  LambdaIntegration,
  AuthorizationType,
} from "@aws-cdk/aws-apigateway";
import { AssetCode, Function, Runtime } from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import { UserPool } from "@aws-cdk/aws-cognito";
import { C$ } from "@crosshatch/cdk";

export const CognitoProtectedApi = C$(cdk.Stack, (def) => {
  const helloWorldFunction = def`helloWorldFunction`(Function, {
    code: new AssetCode("src"),
    handler: "helloworld.handler",
    runtime: Runtime.NODEJS_12_X,
  });

  const helloWorldLambdaRestApi = def`helloWorldLambdaRestApi`(LambdaRestApi, {
    restApiName: "Hello World API",
    handler: helloWorldFunction,
    proxy: false,
  });

  const userPool = def`userPool`(UserPool, {
    signInAliases: {
      email: true,
    },
  });

  const authorizer = def`cfnAuth`(CfnAuthorizer, {
    restApiId: helloWorldLambdaRestApi.restApiId,
    name: "HelloWorldAPIAuthorizer",
    type: "COGNITO_USER_POOLS",
    identitySource: "method.request.header.Authorization",
    providerArns: [userPool.userPoolArn],
  });

  const hello = helloWorldLambdaRestApi.root.addResource("HELLO");

  hello.addMethod("GET", new LambdaIntegration(helloWorldFunction), {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: {
      authorizerId: authorizer.ref,
    },
  });
});

const App = C$(cdk.App, (def) => {
  def`CognitoProtectedApi`(CognitoProtectedApi);
});

new App().synth();
