import cdk = require("@aws-cdk/core");
import {
  CfnGraphQLApi,
  CfnApiKey,
  CfnGraphQLSchema,
  CfnDataSource,
  CfnResolver,
} from "@aws-cdk/aws-appsync";
import {
  Table,
  AttributeType,
  StreamViewType,
  BillingMode,
} from "@aws-cdk/aws-dynamodb";
import { Role, ServicePrincipal, ManagedPolicy } from "@aws-cdk/aws-iam";
import { C8 } from "c8-concept";

export const AppSyncCdkStack = C8(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const tableName = "items";

    const itemsGraphQLApi = def`ItemsApi`(CfnGraphQLApi, {
      name: "items-api",
      authenticationType: "API_KEY",
    });

    def`ItemsApiKey`(CfnApiKey, {
      apiId: itemsGraphQLApi.attrApiId,
    });

    const apiSchema = def`ItemsSchema`(CfnGraphQLSchema, {
      apiId: itemsGraphQLApi.attrApiId,
      definition: `
      type ${tableName} {
        ${tableName}Id: ID!
        name: String
      }
      type Paginated${tableName} {
        items: [${tableName}!]!
        nextToken: String
      }
      type Query {
        all(limit: Int, nextToken: String): Paginated${tableName}!
        getOne(${tableName}Id: ID!): ${tableName}
      }
      type Mutation {
        save(name: String!): ${tableName}
        delete(${tableName}Id: ID!): ${tableName}
      }
      type Schema {
        query: Query
        mutation: Mutation
      }
    `,
    });

    const itemsTable = def`ItemsTable`(Table, {
      tableName: tableName,
      partitionKey: {
        name: `${tableName}Id`,
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const itemsTableRole = def`ItemsDynamoDBRole`(Role, {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
    });

    itemsTableRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    const dataSource = def`ItemsDataSource`(CfnDataSource, {
      apiId: itemsGraphQLApi.attrApiId,
      name: "ItemsDynamoDataSource",
      type: "AMAZON_DYNAMODB",
      dynamoDbConfig: {
        tableName: itemsTable.tableName,
        awsRegion: def.scope.region,
      },
      serviceRoleArn: itemsTableRole.roleArn,
    });

    const getOneResolver = def`GetOneQueryResolver`(CfnResolver, {
      apiId: itemsGraphQLApi.attrApiId,
      typeName: "Query",
      fieldName: "getOne",
      dataSourceName: dataSource.name,
      requestMappingTemplate: `{
      "version": "2017-02-28",
      "operation": "GetItem",
      "key": {
        "${tableName}Id": $util.dynamodb.toDynamoDBJson($ctx.args.${tableName}Id)
      }
    }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    getOneResolver.addDependsOn(apiSchema);

    const getAllResolver = def`GetAllQueryResolver`(CfnResolver, {
      apiId: itemsGraphQLApi.attrApiId,
      typeName: "Query",
      fieldName: "all",
      dataSourceName: dataSource.name,
      requestMappingTemplate: `{
      "version": "2017-02-28",
      "operation": "Scan",
      "limit": $util.defaultIfNull($ctx.args.limit, 20),
      "nextToken": $util.toJson($util.defaultIfNullOrEmpty($ctx.args.nextToken, null))
    }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    getAllResolver.addDependsOn(apiSchema);

    const saveResolver = def`SaveMutationResolver`(CfnResolver, {
      apiId: itemsGraphQLApi.attrApiId,
      typeName: "Mutation",
      fieldName: "save",
      dataSourceName: dataSource.name,
      requestMappingTemplate: `{
      "version": "2017-02-28",
      "operation": "PutItem",
      "key": {
        "${tableName}Id": { "S": "$util.autoId()" }
      },
      "attributeValues": {
        "name": $util.dynamodb.toDynamoDBJson($ctx.args.name)
      }
    }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    saveResolver.addDependsOn(apiSchema);

    const deleteResolver = def`DeleteMutationResolver`(CfnResolver, {
      apiId: itemsGraphQLApi.attrApiId,
      typeName: "Mutation",
      fieldName: "delete",
      dataSourceName: dataSource.name,
      requestMappingTemplate: `{
      "version": "2017-02-28",
      "operation": "DeleteItem",
      "key": {
        "${tableName}Id": $util.dynamodb.toDynamoDBJson($ctx.args.${tableName}Id)
      }
    }`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    deleteResolver.addDependsOn(apiSchema);
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`AppSyncGraphQLDynamoDBExample`(AppSyncCdkStack);
});

new App().synth();
