import * as cdk from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { PipelineStage } from '../Stacks/PipelineStage';

export class AwsCdkLearnStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const source = CodePipelineSource.gitHub('bharath-t/AwsCdkLearn', 'main');

    const pipeline = new CodePipeline(this, 'TestPipeline', {
      pipelineName: 'TestPipeline',
      synth: new ShellStep('Synth', {
        input: source,
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
    });

    const betaStage = new PipelineStage(this, 'betaStage', {
      stageName: 'Beta'
    })

    pipeline.addStage(betaStage);

  }
}
