import { CfnOutput, Environment, Stack, StackProps, aws_s3 } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
// import { execSync } from 'child_process';

interface s3StackProps extends StackProps {
    stageName: string,
    env: Environment,
}

export class s3Stack extends Stack {
    public s3bucket: aws_s3.Bucket;
    constructor(scope: Construct, id: string, props: s3StackProps) {
        super(scope, id, props)

        this.s3bucket = new aws_s3.Bucket(this, 's3Bucket', {
            bucketName: `testbucket-${props.stageName.toLowerCase()}-${props.env.account}`
        })

        // can be referenced in any stack using Fn.importValue('exportName')
        // or create a public variable, assign using this. like above
        new CfnOutput(this, 's3BucketName', {
            value: this.s3bucket.bucketName,
            exportName: "s3DeployBucketName",
        })

        // here we are not using __dirname, directly giving path relative to root directory
        // can pass multiple sources, extract is true by default
        // as zip file is outside python_scripts dir, we are copying it in build_python.sh
        new s3deploy.BucketDeployment(this, 's3Copy', {
            sources: [s3deploy.Source.asset('./python_scripts')],
            destinationBucket: this.s3bucket,
            destinationKeyPrefix: 'code',
            extract: true,
            prune: true,
        });

    }
}