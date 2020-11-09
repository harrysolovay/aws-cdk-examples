import * as cdk from "@aws-cdk/core";
import {
  CfnGraphQLApi,
  CfnApiKey,
  CfnGraphQLSchema,
  CfnDataSource,
  CfnResolver,
} from "@aws-cdk/aws-appsync";
import { Role, ServicePrincipal, PolicyStatement } from "@aws-cdk/aws-iam";
import { Rule } from "@aws-cdk/aws-events";
import * as lambda from "@aws-cdk/aws-lambda";
import * as targets from "@aws-cdk/aws-events-targets";
import { C$ } from "@crosshatch/cdk";

export const AppSyncCdkStack = C$(cdk.Stack, (def, _props?: cdk.StackProps) => {
  const appSync2EventBridgeGraphQLApi = def`AppSync2EventBridgeApi`(
    CfnGraphQLApi,
    {
      name: "AppSync2EventBridge-API",
      authenticationType: "API_KEY",
    }
  );

  def`AppSync2EventBridgeApiKey`(CfnApiKey, {
    apiId: appSync2EventBridgeGraphQLApi.attrApiId,
  });

  const apiSchema = def`ItemsSchema`(CfnGraphQLSchema, {
    apiId: appSync2EventBridgeGraphQLApi.attrApiId,
    definition: `type Event {
    result: String
  }
  
  type Mutation {
    putEvent(event: String!): Event
  }
  
  type Query {
    getEvent: Event
  }
  
  schema {
    query: Query
    mutation: Mutation
  }`,
  });

  const appsyncEventBridgeRole = def`AppSyncEventBridgeRole`(Role, {
    assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
  });

  appsyncEventBridgeRole.addToPolicy(
    new PolicyStatement({
      resources: ["*"],
      actions: ["events:Put*"],
    })
  );

  const dataSource = def`ItemsDataSource`(CfnDataSource, {
    apiId: appSync2EventBridgeGraphQLApi.attrApiId,
    name: "EventBridgeDataSource",
    type: "HTTP",
    httpConfig: {
      authorizationConfig: {
        authorizationType: "AWS_IAM",
        awsIamConfig: {
          signingRegion: def.scope.region,
          signingServiceName: "events",
        },
      },
      endpoint: "https://events." + def.scope.region + ".amazonaws.com/",
    },
    serviceRoleArn: appsyncEventBridgeRole.roleArn,
  });

  const putEventResolver = def`PutEventMutationResolver`(CfnResolver, {
    apiId: appSync2EventBridgeGraphQLApi.attrApiId,
    typeName: "Mutation",
    fieldName: "putEvent",
    dataSourceName: dataSource.name,
    requestMappingTemplate: `{
    "version": "2018-05-29",
    "method": "POST",
    "resourcePath": "/",
    "params": {
      "headers": {
        "content-type": "application/x-amz-json-1.1",
        "x-amz-target":"AWSEvents.PutEvents"
      },
      "body": {
        "Entries":[ 
          {
            "Source":"appsync",
            "EventBusName": "default",
            "Detail":"{ \\\"event\\\": \\\"$ctx.arguments.event\\\"}",
            "DetailType":"Event Bridge via GraphQL"
            }
        ]
      }
    }
  }`,
    responseMappingTemplate: `## Raise a GraphQL field error in case of a datasource invocation error
  #if($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type)
  #end
  ## if the response status code is not 200, then return an error. Else return the body **
  #if($ctx.result.statusCode == 200)
      ## If response is 200, return the body.
      {
        "result": "$util.parseJson($ctx.result.body)"
      }
  #else
      ## If response is not 200, append the response to error block.
      $utils.appendError($ctx.result.body, $ctx.result.statusCode)
  #end`,
  });
  putEventResolver.addDependsOn(apiSchema);

  const echoLambda = def`echoFunction`(lambda.Function, {
    code: lambda.Code.fromInline(
      "exports.handler = (event, context) => { console.log(event); context.succeed(event); }"
    ),
    handler: "index.handler",
    runtime: lambda.Runtime.NODEJS_10_X,
  });

  const rule = def`AppSyncEventBridgeRle`(Rule, {
    eventPattern: {
      source: ["appsync"],
    },
  });
  rule.addTarget(new targets.LambdaFunction(echoLambda));
}, (props) => props);

const App = C$(cdk.App, (def) => {
  def`AppSyncEventBridge`(AppSyncCdkStack);
});

new App().synth();
