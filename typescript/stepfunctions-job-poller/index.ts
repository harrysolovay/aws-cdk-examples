import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as sfn_tasks from "@aws-cdk/aws-stepfunctions-tasks";
import { C8 } from "c8-concept";

const JobPollerStack = C8(
  cdk.Stack,
  (def, _props: cdk.StackProps = {}) => {
    const submitJobActivity = def`SubmitJob`(sfn.Activity);

    const checkJobActivity = def`CheckJob`(sfn.Activity);

    const submitJob = def`SubmitJob`(sfn.Task, {
      task: new sfn_tasks.InvokeActivity(submitJobActivity),
      resultPath: "$.guid",
    });

    const waitX = def`WaitXSeconds`(sfn.Wait, {
      time: sfn.WaitTime.secondsPath("$.wait_time"),
    });

    const getStatus = def`GetJobStatus`(sfn.Task, {
      task: new sfn_tasks.InvokeActivity(checkJobActivity),
      inputPath: "$.guid",
      resultPath: "$.status",
    });

    const isComplete = def`JobComplete?`(sfn.Choice);

    const jobFailed = def`JobFailed`(sfn.Fail, {
      cause: "AWS Batch Job Failed",
      error: "DescribeJob returned FAILED",
    });

    const finalStatus = def`GetFinalJobStatus`(sfn.Task, {
      task: new sfn_tasks.InvokeActivity(checkJobActivity),
      inputPath: "$.guid",
    });

    const chain = sfn.Chain.start(submitJob)
      .next(waitX)
      .next(getStatus)
      .next(
        isComplete
          .when(sfn.Condition.stringEquals("$.status", "FAILED"), jobFailed)
          .when(
            sfn.Condition.stringEquals("$.status", "SUCCEEDED"),
            finalStatus
          )
          .otherwise(waitX)
      );

    def`StateMachine`(sfn.StateMachine, {
      definition: chain,
      timeout: cdk.Duration.seconds(30),
    });
  },
  (props) => props
);

const App = C8(cdk.App, (def) => {
  def`aws-stepfunctions-integ`(JobPollerStack);
});

new App().synth();
