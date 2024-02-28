import { Environment, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaStack } from "./LambdaStack";
import { s3Stack } from "./s3Stack";


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

        new s3Stack(this, 's3Stack', {
            stageName: props.stageName,
            env: props.env
        })

    }
}