#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { infraStack } from './lib/infra-stack';
import { containerStack } from './lib/container-stack';

const app = new cdk.App();

const myVpc = new infraStack(app, 'InfraStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const rinkebyNode = new containerStack(app, 'rinkeby-node', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: myVpc.vpc,
  cluster: myVpc.cluster,
  network: {
    name:  "rinkeby",
    eth_chain_id: "4",
    eth_url: "wss://rinkeby.infura.io/ws/v3/c0d927dc916a4b85bdefbcfcd6204736",
    min_outgoing_confirmations: "2",
    link_contract_address: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
  },
});

const kovanNode = new containerStack(app, 'kovan-node', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: myVpc.vpc,
  cluster: myVpc.cluster,
  network: {
    name:  "kovan",
    eth_chain_id: "42",
    eth_url: "wss://kovan.infura.io/ws/v3/c0d927dc916a4b85bdefbcfcd6204736",
    min_outgoing_confirmations: "2",
    link_contract_address: "0xa36085F69e2889c224210F603D836748e7dC0088"
  },
});

const container = new containerStack(app, 'mainnet-node', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: myVpc.vpc,
  cluster: myVpc.cluster,
  network: {
    name: "mainnet",
    eth_chain_id: "1",
    eth_url: "wss://mainnet.infura.io/ws/v3/c0d927dc916a4b85bdefbcfcd6204736",
    min_outgoing_confirmations: "2",
    link_contract_address: "0x514910771AF9Ca656af840dff83E8264EcF986CA"
  },
});