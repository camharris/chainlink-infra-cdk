#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { infraStack } from '../lib/infra-stack';
import { containerStack } from '../lib/container-stack';

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
    eth_url: process.env.ETH_URL || "wss://",
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
    eth_url: process.env.ETH_URL || "wss://",
    min_outgoing_confirmations: "2",
    link_contract_address: "0xa36085F69e2889c224210F603D836748e7dC0088"
  },
});

const ethMainnetNode = new containerStack(app, 'eth-mainnet-node', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: myVpc.vpc,
  cluster: myVpc.cluster,
  network: {
    name: "eth-mainnet",
    eth_chain_id: "1",
    eth_url: process.env.ETH_URL || "wss://",
    min_outgoing_confirmations: "2",
    link_contract_address: "0x514910771AF9Ca656af840dff83E8264EcF986CA"
  },
});

const bscMainnetNode = new containerStack(app, 'bsc-mainnet-node', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: myVpc.vpc,
  cluster: myVpc.cluster,
  network: {
    name: "bsc-mainnet",
    eth_chain_id: "56",
    eth_url: process.env.ETH_URL || "wss://",
    min_outgoing_confirmations: "2",
    link_contract_address: "0x404460c6a5ede2d891e8297795264fde62adbb75"
  },
});

const bscTestnetNode = new containerStack(app, 'bsc-testnet-node', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpc: myVpc.vpc,
  cluster: myVpc.cluster,
  network: {
    name: "bsc-testnet",
    eth_chain_id: "97",
    eth_url: process.env.ETH_URL || "wss://",
    min_outgoing_confirmations: "2",
    link_contract_address: "0x84b9b910527ad5c03a9ca831909e21e236ea7b06"
  },
});