#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { WebsiteApiStack } from "../lib/website-api-stack"

const app = new cdk.App()

new WebsiteApiStack(app, "WebsiteApiStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
})