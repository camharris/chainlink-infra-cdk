#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { vpcStack } from '../lib/vpc-stack';
import { rdsStack } from '../lib/rds-stack';
import { containerStack } from '../lib/container-stack';

const app = new cdk.App();

const myVpc = new vpcStack(app, 'VpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const rds = new rdsStack(app, 'RdsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: myVpc.vpc,
});

const myEcs = new containerStack(app, 'ContainerStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: myVpc.vpc,
  cluster: myVpc.cluster,
  dbUrl: rds.dbUrl,
  dbSecrets: rds.dbSecrets,
});
