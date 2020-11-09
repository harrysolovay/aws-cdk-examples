#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "@aws-cdk/core"
import { CIStack } from "../lib/ci-stack"
import { C$ } from "@crosshatch/cdk"

const App = C$(cdk.App, (def) => {
    def`CDKExampleLambdaApiCIStack`(CIStack, {
        repositoryName: "lambda-api-ci",
    })
})

new App().synth()
