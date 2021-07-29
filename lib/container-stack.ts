import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecr_assets from '@aws-cdk/aws-ecr-assets';
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as rds from '@aws-cdk/aws-rds';
import { CfnParameter } from '@aws-cdk/core';

export interface containerStackProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc,
  readonly cluster: ecs.ICluster,
  readonly network: any,
}


export class containerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: containerStackProps) {
    super(scope, id, props);


        const dbSecrets = new secretsmanager.Secret(this, 'dbSecrets', {
            secretName: props.network.name +"-db-credentials",
            generateSecretString: {
              secretStringTemplate: JSON.stringify({ username: 'postgres' }),
              generateStringKey: 'password',
              excludePunctuation: true,
              includeSpace: false,
            },
        });


        const dbSecurityGroup = new ec2.SecurityGroup(this, 'dbSecurityGroup', { vpc: props.vpc, securityGroupName: "chainlink-"+props.network.name+"-db-securityGroup" });
        dbSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(5432));

        // Create db instance
        const dbinstance = new rds.DatabaseInstance(this, 'Instance', {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_12}),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
            credentials: rds.Credentials.fromSecret(dbSecrets),
            instanceIdentifier: "chainlink-"+props.network.name+"-db-instance",
            vpc: props.vpc,
            vpcSubnets: {
              subnetType: ec2.SubnetType.PRIVATE,
            },
            securityGroups: [dbSecurityGroup],
            databaseName: "chainlink"
        });


        const nodeImage =  new ecr_assets.DockerImageAsset(this, 'NodeImage', {
            directory: 'docker/',
            exclude: ['.git'],
            buildArgs: {
              api_user: process.env.API_USER || "admin@domain.com",
              api_pass: process.env.API_PASS || "r4nd0mUIpa55wordstr1ng",
              password: process.env.PASSWORD || "r4nd0mW4ll3tpa55wordstr1ng",
            }    
        });


        new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'EcsPattern', {
          cluster: props.cluster,
          serviceName: "chainlink-"+ props.network.name +"-service",
          cpu: 512,
          desiredCount: 1,
          taskImageOptions: {
            containerName: "chainlink-"+ props.network.name +"-node",
            image: ecs.ContainerImage.fromDockerImageAsset(nodeImage),
            containerPort: 6688,
            secrets: {
              DB_PASS: ecs.Secret.fromSecretsManager(dbSecrets, 'password'),
              DB_NAME: ecs.Secret.fromSecretsManager(dbSecrets, 'dbname'),
              DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecrets, 'username'),
              DB_HOST: ecs.Secret.fromSecretsManager(dbSecrets, 'host'),
              DB_PORT: ecs.Secret.fromSecretsManager(dbSecrets, 'port'),
            },
            environment: {
              ROOT: "/chainlink",
              LOG_LEVEL: "debug",
              ETH_CHAIN_ID: props.network.eth_chain_id,
              LINK_CONTRACT_ADDRESS: props.network.link_contract_address,
              CHAINLINK_TLS_PORT: "0",
              SECURE_COOKIES: "false",
              GAS_UPDATER_ENABLED: "true",
              ALLOW_ORIGINS: "*",
              ETH_URL: props.network.eth_url,
              JSON_CONSOLE: "true",
              LOG_TO_DISK: "false",
            },
          },

          memoryLimitMiB: 4096,
          publicLoadBalancer: true

        });

  }
}
