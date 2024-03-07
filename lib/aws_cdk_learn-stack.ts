import * as cdk from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { PipelineStage } from '../Stacks/PipelineStage';
import { PipelineNotificationEvents } from 'aws-cdk-lib/aws-codepipeline';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { NotificationRule } from 'aws-cdk-lib/aws-codestarnotifications';

interface AwsCdkLearnStackProps extends cdk.StackProps {
  env: cdk.Environment
}

export class AwsCdkLearnStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsCdkLearnStackProps) {
    super(scope, id, props);

    const source = CodePipelineSource.gitHub('bharath-t/AwsCdkLearn', 'main');

    const pipeline = new CodePipeline(this, 'TestPipeline', {
      pipelineName: 'TestPipeline',
      synth: new ShellStep('Synth', {
        input: source,
        commands: ['chmod 777 build_python.sh',
          'sh build_python.sh',
          'npm ci', 'npm run build', 'npm test', 'npx cdk synth'],
      }),

    });

    const betaStage = new PipelineStage(this, 'betaStage', {
      stageName: 'Beta',
      env: props.env,
    })

    pipeline.addStage(betaStage);

    // this is must as we are accessing pipeline.pipeline before actually creating it
    // https://aws.amazon.com/blogs/devops/how-to-add-notifications-and-manual-approval-to-an-aws-cdk-pipeline/
    pipeline.buildPipeline();

    const pipelineFailuresTopic = new Topic(this, 'PipelineFailuresTopic', {
      topicName: 'pipelineFailures',
    });
    pipelineFailuresTopic.addSubscription(new EmailSubscription('bharath2792@gmail.com'));

    new NotificationRule(this, 'PipelineNotify', {
      source: pipeline.pipeline,
      targets: [pipelineFailuresTopic],
      events: [PipelineNotificationEvents.PIPELINE_EXECUTION_FAILED,
      PipelineNotificationEvents.PIPELINE_EXECUTION_STARTED,]
    })

  }
}
