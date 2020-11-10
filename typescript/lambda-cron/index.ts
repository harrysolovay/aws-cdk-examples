import events = require("@aws-cdk/aws-events");
import targets = require("@aws-cdk/aws-events-targets");
import lambda = require("@aws-cdk/aws-lambda");
import cdk = require("@aws-cdk/core");
import fs = require("fs");
import { C8 } from "c8-concept";

export const LambdaCronStack = C8(cdk.Stack, (def) => {
  const codeSrc = fs.readFileSync("lambda-handler.py", { encoding: "utf-8" });

  const lambdaFn = def`Singleton`(lambda.Function, {
    code: new lambda.InlineCode(codeSrc),
    handler: "index.main",
    timeout: cdk.Duration.seconds(300),
    runtime: lambda.Runtime.PYTHON_3_6,
  });

  const rule = def`Rule`(events.Rule, {
    schedule: events.Schedule.expression("cron(0 18 ? * MON-FRI *)"),
  });

  rule.addTarget(new targets.LambdaFunction(lambdaFn));
});

const App = C8(cdk.App, (def) => {
  def`LambdaCronExample`(LambdaCronStack);
});

new App().synth();
