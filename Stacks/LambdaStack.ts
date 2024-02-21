import { Stack, StackProps, aws_lambda } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from 'path';

interface LambdaStackProps extends StackProps {
    stageName: string,
}

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props)

        // python_src.zip is created as part of build. check build_python.sh
        new aws_lambda.Function(this, 'LambdaFunction', {
            functionName: `test_lambda1_${props.stageName}`,
            runtime: aws_lambda.Runtime.PYTHON_3_11,
            handler: 'python_scripts.src.lambda1.lambda_handler',
            code: aws_lambda.Code.fromAsset(path.join(__dirname, '../python_src.zip'))
        })
    }
}