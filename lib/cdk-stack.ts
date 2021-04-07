import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';

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



  }
}
