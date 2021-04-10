#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { eksStack } from '../lib/eks-stack';
import { rdsStack } from '../lib/rds-stack';

const app = new cdk.App();

new eksStack(app, 'CdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});


