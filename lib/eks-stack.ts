import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import { HelmChart, KubernetesManifest } from '@aws-cdk/aws-eks';
import { CfnOutput, Fn } from '@aws-cdk/core';

// export interface eksStackProps extends cdk.StackProps {
//   vpc?: ec2.Vpc
//   vpcId?: string
// }

export class eksStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: eks.Cluster;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Build vpc with two public and private subnets
    this.vpc = new ec2.Vpc(this, "Vpc", {
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
    this.cluster = new eks.Cluster(this, 'Eks', {
      version: eks.KubernetesVersion.V1_19,
      defaultCapacity: 0,
      vpc: this.vpc,
      clusterName: 'infra-kube-cluster',
    });

    // Manage node group
    const ng = this.cluster.addNodegroupCapacity("nodegroup", {
      instanceType: new ec2.InstanceType("t3.medium"),
      minSize: 1,
      maxSize: 3,
    });

    const namespace = this.cluster.addManifest('node-namespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: 'node-namespace'}
    });


  }
}
