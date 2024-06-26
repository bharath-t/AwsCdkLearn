import { Duration, Environment, Fn, Stack, StackProps, aws_iam, CfnOutput } from "aws-cdk-lib";
import { aws_lambda, aws_ecr, aws_ecr_assets, RemovalPolicy, aws_s3 } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from 'path';
import * as ecrdeploy from "cdk-ecr-deployment";
import { S3EventSourceV2 } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Alarm, ComparisonOperator } from "aws-cdk-lib/aws-cloudwatch";
import { LambdaAction, SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";


interface LambdaStackProps extends StackProps {
    stageName: string,
    env: Environment,
}

export class LambdaStack extends Stack {
    public ziplambda: aws_lambda.Function;
    public dockerimagelambda1: aws_lambda.DockerImageFunction;
    public dockerimagelambda2: aws_lambda.DockerImageFunction;
    public dockerecrlambda: aws_lambda.DockerImageFunction;


    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props)


        const lambda_role = new aws_iam.Role(this, 'LambdaIam', {
            roleName: `lambdarole_${props.stageName}`,
            assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccessV2'),
            ],
        });

        // custom policy
        const custom_kms_policy = new aws_iam.PolicyStatement({
            actions: ['kms:DescribeKey', 'kms:GenerateDataKey', 'kms:Decrypt', 'kms:Encrypt'],
            resources: ['*'],
            effect: Effect.ALLOW,
        });
        lambda_role.addToPolicy(custom_kms_policy);


        // create lambda using zip file
        // python_src.zip is created as part of build. check build_python.sh
        // __dirname returns current directory of file
        this.ziplambda = new aws_lambda.Function(this, 'LambdaFunction', {
            code: aws_lambda.Code.fromAsset(path.join(__dirname, '../python_src.zip')),
            handler: 'python_scripts.src.lambda1.lambda_handler',
            functionName: `test_lambda1_${props.stageName}`,
            description: 'test lambda1',
            runtime: aws_lambda.Runtime.PYTHON_3_11,
            role: lambda_role,
            timeout: Duration.seconds(300),
            environment: {
                'stage': props.stageName,
                'var1': 'foo',
            },
            memorySize: 128,
            // vpc: props.vpc,
            // architecture: aws_lambda.Architecture.ARM_64
        });


        // create lambda using docker image
        // this internally creates ecr repo
        // check dockerfile, give relative path in cmd 
        let handler_name = 'lambda2';
        let handler_fname = 'lambda_handler';
        this.dockerimagelambda1 = new aws_lambda.DockerImageFunction(this, 'DockerImageFunction', {
            code: aws_lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../python_scripts'), {
                cmd: [`src.${handler_name}.${handler_fname}`],
            }),
            functionName: `test_lambda2_${props.stageName}`,
            description: 'test lambda2',
            role: lambda_role,
            timeout: Duration.seconds(300),
            environment: {
                'stage': props.stageName,
                'var1': 'foo',
            },
            memorySize: 128,
        });


        // create one more lambda using same docker image
        handler_name = 'lambda2';
        handler_fname = 'lambda_handler2';
        this.dockerimagelambda2 = new aws_lambda.DockerImageFunction(this, 'DockerImageFunction2', {
            code: aws_lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../python_scripts'), {
                cmd: [`src.${handler_name}.${handler_fname}`],
            }),
            functionName: `test_lambda4_${props.stageName}`,
            description: 'test lambda4',
            role: lambda_role,
            timeout: Duration.seconds(300),
            environment: {
                'stage': props.stageName,
                'var1': 'foo',
            },
            memorySize: 128,
        });

        const s3DeployBucket = aws_s3.Bucket.fromBucketName(this, 'InputBucket',
            Fn.importValue('s3DeployBucketName')
        );
        s3DeployBucket.grantRead(this.dockerimagelambda2);

        this.dockerimagelambda2.addEventSource(new S3EventSourceV2(s3DeployBucket, {
            events: [aws_s3.EventType.OBJECT_CREATED, aws_s3.EventType.OBJECT_REMOVED],
            filters: [{ prefix: 'input_data/' }],
        }));

        const lambdaFailuresTopic = new Topic(this, 'lambdaFailuresTopic', {
            topicName: `lambdaFailure-${props.stageName}`,
        });
        lambdaFailuresTopic.addSubscription(new EmailSubscription('bharath2792@gmail.com'));


        // adding alarm on lambda errors
        // use lambdaaction instead of snsaction for pager integration
        const lambdaAlarm = new Alarm(this, 'LambdaErrorAlarm', {
            metric: this.dockerimagelambda2.metricErrors(),
            threshold: 1,
            evaluationPeriods: 1,
            comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        });
        lambdaAlarm.addAlarmAction(new SnsAction(lambdaFailuresTopic));



        // create ecr repo, publish local docker image to ecr
        // publishing docker image asset to ecr is a 3rd party library(cdk - ecr - deployment) feature.use with caution
        // ref: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecr_assets-readme.html
        const repoName = 'lambdaecrrepo';
        const ecr_repo = new aws_ecr.Repository(this, 'CustomECRRepo', {
            repositoryName: repoName,
            removalPolicy: RemovalPolicy.DESTROY,
            emptyOnDelete: true,
        });

        const imageAsset = new aws_ecr_assets.DockerImageAsset(this, 'EcrAsset', {
            directory: path.join(__dirname, '../python_scripts'),
            cacheDisabled: true,
        });



        const ecr_deploy = new ecrdeploy.ECRDeployment(this, 'DeployDockerImage', {
            src: new ecrdeploy.DockerImageName(imageAsset.imageUri),
            dest: new ecrdeploy.DockerImageName(ecr_repo.repositoryUri),
        });

        // create lambda using ecr repo
        handler_name = 'lambda2';
        handler_fname = 'lambda_handler2';
        const dockerecrlambda = new aws_lambda.DockerImageFunction(this, 'EcrAssetFunction', {
            code: aws_lambda.DockerImageCode.fromEcr(ecr_repo, {
                cmd: [`src.${handler_name}.${handler_fname}`],
            }),
            functionName: `test_lambda3_${props.stageName}`,
            description: 'test lambda3',
            role: lambda_role,
            timeout: Duration.seconds(300),
            environment: {
                'stage': props.stageName,
                'var1': 'foo',
            },
            memorySize: 128,
        });

        // make sure image is published to ecr before lambda creation
        dockerecrlambda.node.addDependency(ecr_deploy);
        this.dockerecrlambda = dockerecrlambda;

    }
}

