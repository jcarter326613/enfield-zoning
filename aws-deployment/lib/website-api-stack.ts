import * as cdk from "aws-cdk-lib"
import * as ecr from "aws-cdk-lib/aws-ecr"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { Construct } from "constructs"

export class WebsiteApiStack extends cdk.Stack {
    public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const imageTag = this.node.tryGetContext("imageTag")

        if (!imageTag) {
            throw new Error("Missing required CDK context value: imageTag")
        }

        const repository = ecr.Repository.fromRepositoryName(
            this,
            "WebsiteApiRepository",
            "enfieldnhzoning/website-api"
        )

        const websiteApiLambda = new lambda.DockerImageFunction(this, "WebsiteApiLambda", {
            functionName: "enfieldnhzoning-website-api",
            code: lambda.DockerImageCode.fromEcr(repository, {
                tagOrDigest: imageTag
            }),
            architecture: lambda.Architecture.ARM_64,
            memorySize: 512,
            timeout: cdk.Duration.seconds(30)
        })

        const functionUrl = websiteApiLambda.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: [
                  "https://beta.enfieldnhzoning.org", 
                  "http://localhost:4321"
                ],
                allowedMethods: [lambda.HttpMethod.ALL],
                allowedHeaders: [
                  "content-type", 
                  "X-ENFIELDNHZONING-AUTHORIZATION"
                ]
            }
        })

        new cdk.CfnOutput(this, "WebsiteApiFunctionUrl", {
            value: functionUrl.url
        })
    }
}