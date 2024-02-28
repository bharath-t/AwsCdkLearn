import { Environment, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaStack } from "./LambdaStack";
import { s3Stack } from "./s3Stack";
import { GlueStack } from "./GlueStack";


interface PipelineStageProps extends StageProps {
    stageName: string,
    env: Environment,
}


export class PipelineStage extends Stage {
    constructor(scope: Construct, id: string, props: PipelineStageProps) {
        super(scope, id, props)

        new LambdaStack(this, 'LambdaStack', {
            stageName: props.stageName,
            env: props.env
        });

        const s3_stack = new s3Stack(this, 's3Stack', {
            stageName: props.stageName,
            env: props.env
        })

        const glue_stack = new GlueStack(this, 'GlueStack', {
            stageName: props.stageName,
            env: props.env
        });

        // deploy glue stack only after s3 deployment
        glue_stack.node.addDependency(s3_stack);

    }
}