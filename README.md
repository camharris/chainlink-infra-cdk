# Chainlink Node Infrastructure 

This project is currently a work in progress. This TypeScript CDK project is for
deploying a highly available Chainlink Node deployment based on Chainlink's documented [best practices](https://docs.chain.link/docs/best-security-practices).
This CDK application currently will deploy the following into the default AWS environment:
- 1 vpc (for the following to be deployed into)
- 3 availability zones
- 1 ECS cluster 
- 1 RDS instance configured for the node
- 1 Rinkeby network Chainlink node Fargate task 

## TODO
* Refactor containerStack to take arguments that can be used to deploy a rinkeby node or mainnet node.
* Move away from Fargate and to ec2 ECS tasks in order to use persistent storage 

## Deployment 
* Make sure your AWS credentials are configured for the desired environment
 * `cdk bootstrap`   bootstrap your CDK environment 
 * `cdk deploy InfraStack`  deploy the infra/vpc/cluster to your default AWS account/region
 * `cdk deploy RdsStack` deploy the rds deployment to your default AWS account/region
 * `cdk deploy ContainerStack` deploy Rinkeby chainlink node to your ECS cluster

One deployed the app will export the LB url to used for logging into the node's UI. 


### Useful commands
 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
