# Chainlink Node Infrastructure 

This project is currently a work in progress. This TypeScript CDK project is for
deploying a higly available Chainlink Node deployment based on Chainlinks documented [best practices](https://docs.chain.link/docs/best-security-practices).
This CDK application currently will deploy the following into the default AWS environment:
- 1 vpc (for the following to be deployed into)
- 3 availablity zones
- 1 EKS cluster 
- 1 RDS instance configured for the node

## TODO
Finish container deployment stack. Move container deployment away from EKS and
into fargate to save on operating costs.

## Deployment 
* Make sure your AWS credentails are configured for the desired environment
 * `cdk bootstrap`   bootstrap your CDK environment 
 * `cdk deploy`      deploy this stack to your default AWS account/region




### Useful commands
 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
