import { Environment, Stack, StackProps, Tags, aws_ec2, aws_ecs, aws_iam } from "aws-cdk-lib";
import { Construct } from "constructs";

interface Ec2StackProps extends StackProps {
    stageName: string,
    env: Environment,
}

export class EcsStack extends Stack {
    constructor(scope: Construct, id: string, props: Ec2StackProps) {
        super(scope, id, props)


        const ecs_role = new aws_iam.Role(this, 'LambdaIam', {
            roleName: `ecs_task_execution_task_role_${props.stageName}`,
            assumedBy: new aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
            ],
        });

        const cluster = new aws_ecs.Cluster(this, 'Cluster', {
            vpc: aws_ec2.Vpc.fromLookup(this, 'VPC', { isDefault: true }),
            enableFargateCapacityProviders: true,
            containerInsights: true,
        });

        // task execution role should have AmazonECSTaskExecutionRolePolicy, 
        // task role should have access to aws services which your code calls
        // i will use same role for both
        const taskDefinition = new aws_ecs.FargateTaskDefinition(this, 'TaskDef', {
            memoryLimitMiB: 1024,
            cpu: 512,
            taskRole: ecs_role,
            executionRole: ecs_role,
        });

        // we can get image uri from ec2 stack using reponame/ ecr docker asset uri. i am using reponame.
        const repoName = 'ec2ecsrepo'
        taskDefinition.addContainer('EcsContainer', {
            image: aws_ecs.ContainerImage.fromRegistry(`${props.env.account}.dkr.ecr.${props.env.region}.amazonaws.com/${repoName}:latest`),
        });
        Tags.of(taskDefinition).add('td1', 'td11')

        // tasks will be triggered by lambda/stepfunction with container overrides command
        // abc.py, parm1, parm2, ..

    }
}