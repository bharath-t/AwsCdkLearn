# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template

## This package uses pipelines module from aws-cdk-lib.

As mentioned in docs, this is to be used to deploy cdk apps only.
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html

In case custom actions are needed in the pipeline, use aws-codepipeline instead.
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline-readme.html

## Purpose of this project

Create a cicd pipeline template to deploy typical infra required for a DE project

## Steps

1. create empty git repo
2. clone to local
3. create new cdk app using cdk init app --language typescript
4. create new pipeline using pipeline module in cdk app
5. create a stage stack (Beta)
6. add infra stack to each stage (lambda, glue job, stepfunction, ....)
7. add python build steps (error checking + linting + test cases + bundling python scripts) as build step in pipeline stage
8. add integration tests
9. add prod stage

## Useful Notes

1. lambda runtime settings much match with runtime of libraries installed during lambda packaging/ zip file creation. eg: If you use pandas in your python code, the lambda runtime is x86_64 and you are working on windows/mac, make sure to install linux binaries for pandas during packaging. Windows/Mac binaries for pandas will not work on x86_64. (Refer to build_python.sh)

2. When making any changes to pipeline, make sure to do cdk deploy pipeline stack from local first before commiting your changes to git. For some reason, the commands I add to synth steps will not run until I update the pipeline from local first.

3. When attaching ecr repo to lambda, make sure to attach a dependency (deploy lambda only after local image is published to ecr repo), else lambda will fail.

4. Lambda code can be referenced directly using local relative path. For Glue Job, all the required files, jars, additional py files must be copied to s3 using s3 bucket deployment.

5. For Glue Jobs, additional py files must be zip containing only the code we develop. Do not include external python libraries in the zip. For external libraries, use addition python modules parameter instead. We can include external libraries in zip if they are pure python modules not native complied (eg: numpy uses C implementation, can not be used in zip)

## Issues

1. cdk deploy creates new zip files on s3 for each deployment. I could not figure out a way using aws-cdk-lib/pipelines to delete old deployment files after each successful deployment. This will be costly eventually. useful discussion - https://github.com/aws/aws-cdk-rfcs/issues/64
