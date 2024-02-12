import { Stack, StackProps, aws_lambda } from "aws-cdk-lib";
import { Construct } from "constructs";

interface LambdaStackProps extends StackProps {
    stageName: string,
}

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props)


        new aws_lambda.Function(this, 'LambdaFunction', {
            runtime: aws_lambda.Runtime.PYTHON_3_12,
            handler: 'handler.lambda_handler',
            code: new aws_lambda.InlineCode('exports.handler = _ => "Hello, CDK";')
        })
    }
}