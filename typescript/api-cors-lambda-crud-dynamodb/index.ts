import * as apigateway from "@aws-cdk/aws-apigateway";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import { C8 } from "c8-concept";

export const ApiLambdaCrudDynamoDBStack = C8(cdk.Stack, (def) => {
  const dynamoTable = def`items`(dynamodb.Table, {
    partitionKey: {
      name: "itemId",
      type: dynamodb.AttributeType.STRING,
    },
    tableName: "items",
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  const getOneLambda = def`getOneItemFunction`(lambda.Function, {
    code: new lambda.AssetCode("src"),
    handler: "get-one.handler",
    runtime: lambda.Runtime.NODEJS_10_X,
    environment: {
      TABLE_NAME: dynamoTable.tableName,
      PRIMARY_KEY: "itemId",
    },
  });

  const getAllLambda = def`getAllItemsFunctio`(lambda.Function, {
    code: new lambda.AssetCode("src"),
    handler: "get-all.handler",
    runtime: lambda.Runtime.NODEJS_10_X,
    environment: {
      TABLE_NAME: dynamoTable.tableName,
      PRIMARY_KEY: "itemId",
    },
  });

  const createOne = def`createItemFunction`(lambda.Function, {
    code: new lambda.AssetCode("src"),
    handler: "create.handler",
    runtime: lambda.Runtime.NODEJS_10_X,
    environment: {
      TABLE_NAME: dynamoTable.tableName,
      PRIMARY_KEY: "itemId",
    },
  });

  const updateOne = def`updateItemFunction`(lambda.Function, {
    code: new lambda.AssetCode("src"),
    handler: "update-one.handler",
    runtime: lambda.Runtime.NODEJS_10_X,
    environment: {
      TABLE_NAME: dynamoTable.tableName,
      PRIMARY_KEY: "itemId",
    },
  });

  const deleteOne = def`deleteItemFunction`(lambda.Function, {
    code: new lambda.AssetCode("src"),
    handler: "delete-one.handler",
    runtime: lambda.Runtime.NODEJS_10_X,
    environment: {
      TABLE_NAME: dynamoTable.tableName,
      PRIMARY_KEY: "itemId",
    },
  });

  dynamoTable.grantReadWriteData(getAllLambda);
  dynamoTable.grantReadWriteData(getOneLambda);
  dynamoTable.grantReadWriteData(createOne);
  dynamoTable.grantReadWriteData(updateOne);
  dynamoTable.grantReadWriteData(deleteOne);

  const api = def`itemsApi`(apigateway.RestApi, {
    restApiName: "Items Service",
  });

  const items = api.root.addResource("items");
  const getAllIntegration = new apigateway.LambdaIntegration(getAllLambda);
  items.addMethod("GET", getAllIntegration);

  const createOneIntegration = new apigateway.LambdaIntegration(createOne);
  items.addMethod("POST", createOneIntegration);
  addCorsOptions(items);

  const singleItem = items.addResource("{id}");
  const getOneIntegration = new apigateway.LambdaIntegration(getOneLambda);
  singleItem.addMethod("GET", getOneIntegration);

  const updateOneIntegration = new apigateway.LambdaIntegration(updateOne);
  singleItem.addMethod("PATCH", updateOneIntegration);

  const deleteOneIntegration = new apigateway.LambdaIntegration(deleteOne);
  singleItem.addMethod("DELETE", deleteOneIntegration);
  addCorsOptions(singleItem);
});

export function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials":
              "'false'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    }
  );
}

const App = C8(cdk.App, (def) => {
  def`ApiLambdaCrudDynamoDBExample`(ApiLambdaCrudDynamoDBStack);
});

new App().synth();
