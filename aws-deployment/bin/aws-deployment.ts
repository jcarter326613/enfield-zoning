#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { WebsiteApiStack } from "../lib/website-api-stack"

const app = new cdk.App()
const deployment = app.node.tryGetContext("deployment") ?? "dev"
const deploymentName = deployment == "prod" ? "WebsiteApiStack-prod" : "WebsiteApiStack"

new WebsiteApiStack(app, deploymentName, {
    deployment,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
})