import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as iam from '@aws-cdk/aws-iam';
import { readYamlFromDir } from '../utils/readfile';
import { HelmChart, KubernetesManifest } from '@aws-cdk/aws-eks';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Build vpc with two public and private subnets
    const vpc = new ec2.Vpc(this, "Vpc", {
      cidr: "10.0.0.0/16",
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE,
        },
        {
          cidrMask: 24,
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet-2',
          subnetType: ec2.SubnetType.PRIVATE,
        },
        {
          cidrMask: 24,
          name: 'public-subnet-2',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ]
    });
    // TODO figure out how to tag resources
    //Tags.of(vpc).add("Name", "infra-kube-vpc");


    // Build EKS cluster in new vpc
    const cluster = new eks.Cluster(this, 'Eks', {
      version: eks.KubernetesVersion.V1_19,
      defaultCapacity: 0,
      vpc: vpc,
      clusterName: 'infra-kube-cluster',
    });

    // Manage node group
    const ng = cluster.addNodegroupCapacity("nodegroup", {
      instanceType: new ec2.InstanceType("t3.medium"),
      minSize: 1,
      maxSize: 3,
    });

    const namespace = cluster.addManifest('node-namespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: 'node-namespace'}
    });

    // Create secrets
    const postgresqlSecrets = new secretsmanager.Secret(this, 'postgresqlSecrets', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password'
      },
    });

    const nodeSecrets = new secretsmanager.Secret(this, 'nodeSecrets', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ apiuser: 'charris@protonmail.ch' }),
        generateStringKey: 'apipass',
        //generateStringKey: ''
      }
    })

    // TODO add wallet secret

    // Install postgres helm chart
    new HelmChart(this, 'PostgreSQL', {
    //const postgresChart = cluster.addHelmChart('PostgresSQL', {
      cluster,
      chart: 'postgresql',
      repository: 'https://charts.bitnami.com/bitnami',
      namespace: 'node-namespace',
      release: 'database',
      values: {
        'postgresqlPassword': postgresqlSecrets.secretValueFromJson('password'),
        'postgresqlUsername': postgresqlSecrets.secretValueFromJson('username').toString(),
        'postgresqlDatabase': 'chainlink'
      },

    });
    //postgresChart.node.addDependency(namespace);


    // Read Yaml files
    //const manifestsFolder = 'manifests/';
    //readYamlFromDir(manifestsFolder, cluster)

    const appLabel = { app: "chainlink-node" };
    const dbString =  new String("postgresql://" + postgresqlSecrets.secretValueFromJson('username').toString() + postgresqlSecrets.secretValueFromJson('password') + "@postgres:5432/chainlink?sslmode=disable");

    const node_config = {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: { name: "node-config" },
      data: {
        ROOT: "/chainlink",
        LOG_LEVEL: "debug",
        ETH_CHAIN_ID: 3,
        MIN_OUTGOING_CONFIRMATIONS: 2,
        LINK_CONTRACT_ADDRESS: "0x20fe562d797a42dcb3399062ae9546cd06f63280",
        CHAINLINK_TLS_PORT: 0,
        SECURE_COOKIES: false,
        ORACLE_CONTRACT_ADDRESS: "0x9f37f5f695cc16bebb1b227502809ad0fb117e08",
        ALLOW_ORIGINS: "*",
        MINIMUM_CONTRACT_PAYMENT: 100,
        DATABASE_URL: dbString.toString(),
        DATABASE_TIMEOUT: 0,
        ETH_URL: "wss://ropsten-rpc.linkpool.io/ws",
      },
    };


    new KubernetesManifest(this, 'nodeConfigMap', {
      cluster,
      manifest: [ node_config ]
    });


    const deployment = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: { name: "chainlink-node" },
      spec: {
        selector: { matchLabels: appLabel },
        template: {
          metadata: { labels: appLabel },
          spec: {
            containers: [
            {
              name: "chainlink-node",
              image: "smartcontract/chainlink:0.10.3",
              ports: [ { containerPort: 6688 } ],
              envFrom: [{
                  configMapRef: { name: "node-config"}
              }],
              //args: ["local", "n", "-p",  "/chainlink/.password", "-a", "/chainlink/.api"]
            }
            ],
          }
        }
      }
    }; // End Deployment manifest

    new KubernetesManifest(this, 'chainlink-deployment', {
      cluster,
      manifest: [ deployment ]
    });

  }
}
