import * as cdk from "@aws-cdk/core";
import { CfnApp, CfnBranch } from "@aws-cdk/aws-amplify";
import { C$ } from "@crosshatch/cdk";

export const AmplifyConsoleAppCdkStack = C$(cdk.Stack, (def, _props?: cdk.StackProps) => {
  const amplifyApp = def`test-app`(CfnApp, {
    name: "your-amplify-console-app-name",
    repository: "https://github.com/<the-rest-of-the-repository-url>",
    oauthToken: "<your-gitHub-oauth-token>",
  });

  def`MasterBranch`(CfnBranch, {
    appId: amplifyApp.attrAppId,
    branchName: "master",
  });
}, (props) => props);

const App = C$(cdk.App, (def) => {
  def`AmplifyConsoleApp`(AmplifyConsoleAppCdkStack);
});

new App().synth();
