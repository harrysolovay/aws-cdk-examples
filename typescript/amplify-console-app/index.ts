import * as cdk from "@aws-cdk/core";
import { CfnApp, CfnBranch } from "@aws-cdk/aws-amplify";
import { C8 } from "c8-concept";

export const AmplifyConsoleAppCdkStack = C8(
  cdk.Stack,
  (def, _props?: cdk.StackProps) => {
    const amplifyApp = def`test-app`(CfnApp, {
      name: "your-amplify-console-app-name",
      repository: "https://github.com/<the-rest-of-the-repository-url>",
      oauthToken: "<your-gitHub-oauth-token>",
    });

    def`MasterBranch`(CfnBranch, {
      appId: amplifyApp.attrAppId,
      branchName: "master",
    });
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`AmplifyConsoleApp`(AmplifyConsoleAppCdkStack);
});

new App().synth();
