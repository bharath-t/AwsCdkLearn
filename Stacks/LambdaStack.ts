import { Duration, Stack, StackProps, aws_iam, aws_lambda } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from 'path';

interface LambdaStackProps extends StackProps {
    stageName: string,
}

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props)


        const lambda_role = new aws_iam.Role(this, 'LambdaIam', {
            roleName: `lambdarole_${props.stageName}`,
            assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
            ],
        });

        // custom policy
        const custom_kms_policy = new aws_iam.PolicyStatement({
            actions: ['kms:DescribeKey', 'kms:GenerateDataKey', 'kms:Decrypt', 'kms:Encrypt'],
            resources: ['*'],
            effect: Effect.ALLOW,
        });
        lambda_role.addToPolicy(custom_kms_policy);


        // python_src.zip is created as part of build. check build_python.sh
        new aws_lambda.Function(this, 'LambdaFunction', {
            functionName: `test_lambda1_${props.stageName}`,
            description: 'test lambda1',
            runtime: aws_lambda.Runtime.PYTHON_3_11,
            handler: 'python_scripts.src.lambda1.lambda_handler',
            code: aws_lambda.Code.fromAsset(path.join(__dirname, '../python_src.zip')),
            role: lambda_role,
            timeout: Duration.seconds(300),
            environment: {
                'stage': props.stageName,
                'var1': 'foo',
            },
            // vpc: props.vpc,
        })
    }
}