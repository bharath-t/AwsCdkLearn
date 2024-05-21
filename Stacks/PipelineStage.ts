import { Environment, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaStack } from "./LambdaStack";
import { s3Stack } from "./s3Stack";
import { GlueStack } from "./GlueStack";
import { StepFunctionStack } from "./StepFunctionStack";
import { Ec2Stack } from "./Ec2Stack";


interface PipelineStageProps extends StageProps {
    stageName: string,
    env: Environment,
}


export class PipelineStage extends Stage {
    constructor(scope: Construct, id: string, props: PipelineStageProps) {
        super(scope, id, props)

        const s3_stack = new s3Stack(this, 's3Stack', {
            stageName: props.stageName,
            env: props.env
        });

        const lambda_stack = new LambdaStack(this, 'LambdaStack', {
            stageName: props.stageName,
            env: props.env
        });

        const glue_stack = new GlueStack(this, 'GlueStack', {
            stageName: props.stageName,
            env: props.env
        });

        const sfn_stack = new StepFunctionStack(this, 'StepFunctionStack', {
            stageName: props.stageName,
            env: props.env,
            ziplambda: lambda_stack.ziplambda,
            dockerimagelambda1: lambda_stack.dockerimagelambda1,
            glueJob: glue_stack.glueJob,
        });

        // deploy glue, lambda stack only after s3 deployment
        lambda_stack.node.addDependency(s3_stack);
        glue_stack.node.addDependency(s3_stack);

        // deploy step function only after glue, lambda stack are deployed
        sfn_stack.node.addDependency(lambda_stack);
        sfn_stack.node.addDependency(glue_stack);

        const ec2_stack = new Ec2Stack(this, 'Ec2Stack', {
            stageName: props.stageName,
            env: props.env,
        });

    }
}