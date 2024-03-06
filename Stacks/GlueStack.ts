import { Environment, Stack, StackProps, aws_glue, Fn, aws_iam } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface GlueStackProps extends StackProps {
    stageName: string,
    env: Environment,
}

export class GlueStack extends Stack {
    public glueJob: aws_glue.CfnJob;
    constructor(scope: Construct, id: string, props: GlueStackProps) {
        super(scope, id, props)

        // custom inline policy
        const gluePolicyDocument = new aws_iam.PolicyDocument({
            statements: [
                new aws_iam.PolicyStatement({
                    actions: ["Athena:StartQueryExecution", "dynamodb:GetItem"],
                    effect: Effect.ALLOW,
                    resources: ["*"],
                }),
                // required to publish logs to cloudwatch
                new aws_iam.PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ["logs:*"],
                    resources: ["*"],
                },)
            ]
        })

        const glue_role = new aws_iam.Role(this, 'LambdaIam', {
            roleName: `gluerole_${props.stageName}`,
            assumedBy: new aws_iam.ServicePrincipal('glue.amazonaws.com'),
            managedPolicies: [
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AWSGlueConsoleFullAccess'),
            ],
            inlinePolicies: {
                glueInlinePolicy: gluePolicyDocument
            }
        });

        // custom policy
        const custom_kms_policy = new aws_iam.PolicyStatement({
            actions: ['kms:DescribeKey', 'kms:GenerateDataKey', 'kms:Decrypt', 'kms:Encrypt'],
            resources: ['*'],
            effect: Effect.ALLOW,
        });
        glue_role.addToPolicy(custom_kms_policy);


        // access bucket name from s3 stack, append script, zip locations
        const s3DeployBucketName = Fn.importValue('s3DeployBucketName');
        let scriptLocation = `s3://${s3DeployBucketName}/code/src/glue1.py`;
        let utilityZipLocation = `s3://${s3DeployBucketName}/code/gluezip.zip`;
        let jarLocations;

        // comma separated string (lib1==1.1.1, lib2==1.2.3, ...)
        let pythonDependencyModules = "pandas==1.5.1";

        // creating glue etl Job. based on usecase (python shell/ spark streaming / ray job), 
        // configure command section below
        this.glueJob = new aws_glue.CfnJob(this, 'GlueJob1', {
            name: `glue_test1_${props.stageName}`,
            role: glue_role.roleName,
            command: {
                name: "glueetl",
                pythonVersion: "3",
                scriptLocation: scriptLocation,
            },
            defaultArguments: {
                "--job-language": "python",
                "--enable-glue-datacatalog": "true",
                "--enable-spark-ui": "true",
                "--enable-continuous-cloudwatch-log": "true",
                "--stage": props.stageName,
                "--extra-jars": jarLocations,
                "--extra-py-files": utilityZipLocation,
                "--spark-event-logs-path": `s3://${s3DeployBucketName}/glueSparkLogs/`,
                "--TempDir": `s3://${s3DeployBucketName}/glueTempDir/`,
                "--enable-auto-scaling": "true",
                "--additional-python-modules": pythonDependencyModules,
            },
            executionProperty: {
                maxConcurrentRuns: 3,
            },
            logUri: `s3://${s3DeployBucketName}/glueLogs/`,
            workerType: "G.1X",
            glueVersion: "4.0",
            maxRetries: 0,
            timeout: 10,
            numberOfWorkers: 5,
        })

        // // schedule the job using cron
        // new aws_glue.CfnTrigger(this, 'GlueJob1Trigger', {
        //     description: "scheduler for aws glue job",
        //     type: "SCHEDULED",
        //     startOnCreation: true,
        //     actions: [{ jobName: glueJob.name }],
        //     schedule: "cron(0 9 ? * MON *)",
        // })
    }
}