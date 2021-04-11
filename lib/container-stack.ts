import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import { HelmChart, KubernetesManifest } from '@aws-cdk/aws-eks';

export interface containerStackProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc,
  readonly cluster: eks.ICluster,
}

export class containerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: containerStackProps) {
    super(scope, id, props);


        const appLabel = { app: "chainlink-node" };


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
            //DATABASE_URL: `${dbUrl}`,
            DATABASE_URL: "postgresql://postgres:password@172.17.0.1:5432/chainlink?sslmode=disable",
            DATABASE_TIMEOUT: 0,
            ETH_URL: "wss://ropsten-rpc.linkpool.io/ws",
          },
        };


        new KubernetesManifest(this, 'nodeConfigMap', {
          cluster: props.cluster,
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
          cluster: props.cluster,
          manifest: [ deployment ]
        });



  }
}
