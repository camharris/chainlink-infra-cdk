import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecr_assets from '@aws-cdk/aws-ecr-assets';
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import { join } from 'path';

export interface containerStackProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc,
  readonly cluster: ecs.ICluster,
  readonly dbSecrets: secretsmanager.ISecret,
  readonly dbUrl: string,
}

export class containerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: containerStackProps) {
    super(scope, id, props);


        const nodeImage =  new ecr_assets.DockerImageAsset(this, 'NodeImage', {
            directory: 'docker/',
            exclude: ['.git'],
            buildArgs: {
              api_user: "user@domain.com",
              api_pass: "Pl3as3Chang3M3",
              password: "FDAFsdf4345fgGFGkuiy76445",
            },
            
        });


        new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'EcsPattern', {
          cluster: props.cluster,
          cpu: 512,
          desiredCount: 1,
          taskImageOptions: {
            image: ecs.ContainerImage.fromDockerImageAsset(nodeImage),
            containerPort: 6688,
            secrets: {
              DB_PASS: ecs.Secret.fromSecretsManager(props.dbSecrets, 'password'),
              DB_NAME: ecs.Secret.fromSecretsManager(props.dbSecrets, 'dbname'),
              DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbSecrets, 'username'),
              DB_HOST: ecs.Secret.fromSecretsManager(props.dbSecrets, 'host'),
              DB_PORT: ecs.Secret.fromSecretsManager(props.dbSecrets, 'port'),
              //DATABASE_URL: ecs.Secret.fromSecretsManager(props.dbSecrets, 'host'),
            },
            environment: {
              ROOT: "/chainlink",
              LOG_LEVEL: "debug",
              ETH_CHAIN_ID: "4",
              MIN_OUTGOING_CONFIRMATIONS: "2",
              LINK_CONTRACT_ADDRESS: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
              CHAINLINK_TLS_PORT: "0",
              SECURE_COOKIES: "false",
              GAS_UPDATER_ENABLED: "true",
              ALLOW_ORIGINS: "*",
              // DATABASE_URL2: props.dbUrl,
              //DATABASE_URL: "postgresql://${DB_USERNAME}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}",
              ETH_URL: "wss://rinkeby.infura.io/ws/v3/c0d927dc916a4b85bdefbcfcd6204736",
            },
          },

          memoryLimitMiB: 4096,
          publicLoadBalancer: true

        });

  }
}
