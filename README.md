# Chainlink Node Infrastructure 

This project is currently a work in progress. This TypeScript CDK project is for
deploying a highly available Chainlink Node deployment based on Chainlink's documented [best practices](https://docs.chain.link/docs/best-security-practices).
This CDK application currently will deploy the following into the default AWS environment:
- 1 vpc (for the following to be deployed into)
- 3 availability zones
- 1 ECS cluster 
- 1 RDS instance for each of the following:
- 1 Rinkeby network Chainlink node Fargate task 
- 1 Kovan network Chainlink node Fargate task 
- 1 Mainnet network Chainlink node Fargate task 

## TODO
* Randomly generate wallet password and api_pass and add to AWS ssm
* Allow command line parameter of api_user 

## Configure
1. Edit `bin/cdk.ts` and set the appropriate eth_url for each node.
2. Edit `lib/container-stack.ts` and set the desired `api_user`, `api_pass`, and `password`


## Deployment 
* Make sure your AWS credentials are configured for the desired environment
 * `cdk bootstrap`   bootstrap your CDK environment 
 * `cdk deploy InfraStack`  deploy the infra/vpc/cluster to your default AWS account/region
 * `cdk deploy rinkeby-node` deploy Rinkeby Chainlink node with rds instance, and associated secret
 * `cdk deploy kovan-node` deploy Kovan Chainlink node with rds instance, and associated secret
 * `cdk deploy mainnet-node` deploy Mainnet Chainlink node with rds instance, and associated secret

One deployed the app will export the LB url to used for logging into the node's UI. 


### Useful commands
 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
