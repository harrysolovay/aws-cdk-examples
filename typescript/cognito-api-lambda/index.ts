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
  // Function that returns 201 with "Hello world!"
  const helloWorldFunction = def`helloWorldFunction`(Function, {
    code: new AssetCode("src"),
    handler: "helloworld.handler",
    runtime: Runtime.NODEJS_12_X,
  });

  // Rest API backed by the helloWorldFunction
  const helloWorldLambdaRestApi = def`helloWorldLambdaRestApi`(LambdaRestApi, {
    restApiName: "Hello World API",
    handler: helloWorldFunction,
    proxy: false,
  });

  // Cognito User Pool with Email Sign-in Type.
  const userPool = def`userPool`(UserPool, {
    signInAliases: {
      email: true,
    },
  });

  // Authorizer for the Hello World API that uses the
  // Cognito User pool to Authorize users.
  const authorizer = def`cfnAuth`(CfnAuthorizer, {
    restApiId: helloWorldLambdaRestApi.restApiId,
    name: "HelloWorldAPIAuthorizer",
    type: "COGNITO_USER_POOLS",
    identitySource: "method.request.header.Authorization",
    providerArns: [userPool.userPoolArn],
  });

  // Hello Resource API for the REST API.
  const hello = helloWorldLambdaRestApi.root.addResource("HELLO");

  // GET method for the HELLO API resource. It uses Cognito for
  // authorization and the auathorizer defined above.
  hello.addMethod("GET", new LambdaIntegration(helloWorldFunction), {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: {
      authorizerId: authorizer.ref,
    },
  });
});

const App = C$(cdk.App, (def) => {
  def`CognitoProtectedApi`(CognitoProtectedApi);
})

new App().synth();
