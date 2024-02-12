#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsCdkLearnStack } from '../lib/aws_cdk_learn-stack';

const app = new cdk.App();
new AwsCdkLearnStack(app, 'AwsCdkLearnStack', {
  env: { account: '415283085407', region: 'us-east-1' }
});

app.synth();