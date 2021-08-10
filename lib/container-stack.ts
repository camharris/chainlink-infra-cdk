import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecr_assets from '@aws-cdk/aws-ecr-assets';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as rds from '@aws-cdk/aws-rds';
import * as iam from '@aws-cdk/aws-iam';
import * as efs from '@aws-cdk/aws-efs';
import * as route53 from '@aws-cdk/aws-route53';
import * as logs from '@aws-cdk/aws-logs';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { HostedZone } from '@aws-cdk/aws-route53';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import { Port, Protocol } from '@aws-cdk/aws-ec2';
import { Duration } from '@aws-cdk/core';
import { url } from 'inspector';
import { PerformanceInsightRetention } from '@aws-cdk/aws-rds';

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

        const fileSystem = new efs.FileSystem(this, 'FileSystem', {
          vpc: props.vpc,
          performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
          throughputMode: efs.ThroughputMode.BURSTING    
        });


        const logGroup = new logs.LogGroup(this, 'LogGroup', {
          retention: RetentionDays.ONE_WEEK,
        });

        const accessPoint = fileSystem.addAccessPoint('AccessPoint', {
          path: '/chainlink', // This will probably overwrite the contents 
          posixUser: {
            uid: '1000',
            gid: '1000',
          },
          createAcl: {
            ownerGid: '1000',
            ownerUid: '1000',
            permissions: '755',
          }
        })

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'nodeServiceDefinition', {
          memoryLimitMiB: 4096,
          cpu: 512,
          family: "chainlink-"+props.network.name+"-definition",
        });

        taskDefinition.addVolume({
          name: props.network.name+"-node-volume",
          efsVolumeConfiguration: {
            fileSystemId: fileSystem.fileSystemId,
            transitEncryption: 'ENABLED',
            authorizationConfig: {
              accessPointId: accessPoint.accessPointId,
              iam: 'ENABLED'
            }
          }
        });

        taskDefinition.taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))


        const containerDefinition = taskDefinition.addContainer('node', {
          image: ecs.ContainerImage.fromDockerImageAsset(nodeImage),
          logging: ecs.LogDrivers.awsLogs({
            streamPrefix: +props.network.name+"-node",
            logGroup: logGroup
          }),
          portMappings: [{
            containerPort: 6688
          }],
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
              ENABLE_EXPERIMENTAL_ADAPTERS: "true",
          },
          
        });

        containerDefinition.addMountPoints({
          containerPath: '/chainlink',
          sourceVolume: props.network.name+"-node-volume",
          readOnly: false
        });

        const service = new ecs.FargateService(this, 'nodeService', {
          cluster: props.cluster,
          serviceName: "chainlink-"+ props.network.name +"-service",
          taskDefinition,
          desiredCount: 1,
          maxHealthyPercent: 100,
          minHealthyPercent: 0,
          healthCheckGracePeriod: Duration.minutes(3),
          enableExecuteCommand: true,
          // TODO add logging of execute command 
        });
        service.connections.allowTo(fileSystem, Port.tcp(2049));

        let certificateArn = this.node.tryGetContext('certificateArn');
        if (certificateArn) {
          const loadbalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {vpc: props.vpc, internetFacing: true});
          new cdk.CfnOutput(this, 'LoadBalancerDNSName', {value: loadbalancer.loadBalancerDnsName});

          const listener = loadbalancer.addListener('Listener', {
            port: 443,
            certificateArns: [certificateArn]
          });

          listener.addTargets('nodeTarge', {
            port: 6688,
            protocol: elbv2.ApplicationProtocol.HTTP, 
            targets: [service],
            deregistrationDelay: Duration.seconds(10),
            healthCheck: {
              path: '/'
            }
          });
      

          const hostedZoneName = this.node.tryGetContext('hostedZoneName')
          if (hostedZoneName){
            const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
              domainName: hostedZoneName
            });
            new route53.CnameRecord(this, 'CnameRecord', {
              zone: hostedZone,
              recordName: props.network.name,
              domainName: loadbalancer.loadBalancerDnsName,
              ttl: Duration.minutes(1)
            });
          }
          
        }


        


  }
}
