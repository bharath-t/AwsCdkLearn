import { Environment, Stack, StackProps, aws_iam, aws_ecr_assets, CfnOutput, RemovalPolicy, aws_ecr, aws_ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from 'path';
import * as ecrdeploy from "cdk-ecr-deployment";
import { Effect } from "aws-cdk-lib/aws-iam";


interface Ec2StackProps extends StackProps {
    stageName: string,
    env: Environment,
}

export class Ec2Stack extends Stack {
    public ec2_role: aws_iam.Role;
    public ec2_instanceProfile: aws_iam.InstanceProfile;

    constructor(scope: Construct, id: string, props: Ec2StackProps) {
        super(scope, id, props)

        // creating ecr repo for python script to be deployed on ec2, ecs
        const repoName = 'ec2ecsrepo';
        const ecr_repo = new aws_ecr.Repository(this, 'EC2ECSRepo', {
            repositoryName: repoName,
            removalPolicy: RemovalPolicy.DESTROY,
            emptyOnDelete: true,
            lifecycleRules: [{ maxImageCount: 5 }]
        });

        // platform should match with ec2 type which it will be deployed on
        // amd is old, arm is latest. aws free tier (t2 micro) only offers/supports amd.
        const pythonecr = new aws_ecr_assets.DockerImageAsset(this, 'ecrImage', {
            directory: path.join(__dirname, '../python_scripts/src/ec2_ecs'),
            platform: aws_ecr_assets.Platform.LINUX_AMD64,
            assetName: 'pythonecrrepo',
        });


        new CfnOutput(this, 'pythonecrimage', {
            value: pythonecr.imageUri,
            exportName: "pythonecrimage",
        });

        const ecr_deploy = new ecrdeploy.ECRDeployment(this, 'DeployDockerImage', {
            src: new ecrdeploy.DockerImageName(pythonecr.imageUri),
            dest: new ecrdeploy.DockerImageName(ecr_repo.repositoryUri),
        });

        ecr_deploy.node.addDependency(pythonecr);


        this.ec2_role = new aws_iam.Role(this, 'Ec2Iam', {
            roleName: `ec2role_${props.stageName}`,
            assumedBy: new aws_iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
            ],
        });

        // custom policy to pull images from ecr
        const custom_ecr_policy = new aws_iam.PolicyStatement({
            actions: ["ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage", "ecr:DescribeImages",
                "ecr:GetAuthorizationToken", "ecr:BatchCheckLayerAvailability"],
            resources: ['*'],
            effect: Effect.ALLOW,
        });
        this.ec2_role.addToPolicy(custom_ecr_policy);



        // needed only for ec2, ec2servicerole of emr
        this.ec2_instanceProfile = new aws_iam.InstanceProfile(this, 'Ec2InstanceProfile', {
            instanceProfileName: this.ec2_role.roleName,
            role: this.ec2_role,
        });

        // use default vpc for ec2

        // bootstrap script (install dependencies, copy scripts from s3 if needed)
        const userDataScript = aws_ec2.UserData.forLinux();
        userDataScript.addCommands(
            'sudo su',
            'yum update -y',
            'yum install -y python3-pip',
            'yum install -y docker',
            'chmod 666 /var/run/docker.sock',
            'service docker start',
            'usermod -a -G docker ec2-user',
            `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${props.env.account}.dkr.ecr.${props.env.region}.amazonaws.com`,
            `docker pull ${props.env.account}.dkr.ecr.${props.env.region}.amazonaws.com/ec2ecsrepo:latest`
        );
        // sudo docker run -v ~/.aws:/root/.aws 415283085407.dkr.ecr.us-east-1.amazonaws.com/ec2ecsrepo:latest python3 process.py


        // commenting as the use case is tested, was able to trigger python scripts using above docker command.

        const ec2Instance = new aws_ec2.Instance(this, 'EC2Instance', {
            instanceType: aws_ec2.InstanceType.of(aws_ec2.InstanceClass.T2, aws_ec2.InstanceSize.MICRO),
            machineImage: aws_ec2.MachineImage.latestAmazonLinux2023({
                cachedInContext: true,
            }),
            vpc: aws_ec2.Vpc.fromLookup(this, 'VPC', { isDefault: true }),
            role: this.ec2_role,
            userData: userDataScript,
            userDataCausesReplacement: true,
            ssmSessionPermissions: true,
        });
        ec2Instance.node.addDependency(ecr_deploy);

    }
}