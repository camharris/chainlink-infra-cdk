import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { CfnOutput, Fn } from '@aws-cdk/core';


export class vpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Build vpc with two public and private subnets
    this.vpc = new ec2.Vpc(this, "Vpc", {
      cidr: "10.0.0.0/16",
      maxAzs: 3,
    });

    // Parameter store


  }
}
