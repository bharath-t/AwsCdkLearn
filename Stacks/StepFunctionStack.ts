import { Duration, Environment, Stack, StackProps } from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sfn_task from "aws-cdk-lib/aws-stepfunctions-tasks";
import { CfnJob } from "aws-cdk-lib/aws-glue";
import { Function, DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";


interface StepFunctionStackProps extends StackProps {
    stageName: string,
    env: Environment,
    ziplambda: Function,
    dockerimagelambda1: DockerImageFunction,
    glueJob: CfnJob,
}

export class StepFunctionStack extends Stack {
    constructor(scope: Construct, id: string, props: StepFunctionStackProps) {
        super(scope, id, props)

        const start = new sfn.Pass(this, 'Step Function Started!');
        const success = new sfn.Succeed(this, 'Step Function Succeeded!');

        // integrationPattern is set to request_response. this will make step function
        // wait for response from current Task before moving to next.
        const lambda1_start = new sfn_task.LambdaInvoke(this, 'Lambda1Invoke', {
            lambdaFunction: props.ziplambda,
            outputPath: '$.Payload',
            integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
        });

        const lambda2_start = new sfn_task.LambdaInvoke(this, 'Lambda2Invoke', {
            lambdaFunction: props.dockerimagelambda1,
            outputPath: '$.Payload',
            integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
        });

        const glue_start = new sfn_task.GlueStartJobRun(this, 'GlueInvoke', {
            glueJobName: props.glueJob.name!,
            arguments: sfn.TaskInput.fromObject({
                "--lambda2output1": sfn.JsonPath.stringAt('$.lambda2output1'),
            }),
            integrationPattern: sfn.IntegrationPattern.RUN_JOB, // wait for completion
            outputPath: '$',
        });
        glue_start.next(success);

        const WaitStep = new sfn.Wait(this, 'WaitStep', {
            time: sfn.WaitTime.duration(Duration.seconds(15)),
        });
        WaitStep.next(lambda2_start);

        // if lambda2output1 param from lambda2 returns Y, trigger glue job, else wait
        const choiceStep = new sfn.Choice(this, 'Lambda2OutputChoice')
            .when(sfn.Condition.stringEquals('$.lambda2output1', 'Y'), glue_start)
            .otherwise(WaitStep);

        const definition = start
            .next(lambda1_start)
            .next(lambda2_start)
            .next(choiceStep)

        new sfn.StateMachine(this, 'StateMachine', {
            definitionBody: sfn.DefinitionBody.fromChainable(definition),
            timeout: Duration.minutes(10),
            comment: 'sample state machine',
        });

    }

}