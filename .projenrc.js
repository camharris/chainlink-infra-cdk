const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  author: 'Cameron Harris',
  authorAddress: 'charris@protonmail.ch',
  cdkVersion: '1.116.0',
  defaultReleaseBranch: 'main',
  name: '@camharris/chainlink-infra-cdk',

  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-ecr-assets',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-secretsmanager',
    '@aws-cdk/aws-rds',
  ],
  description: 'A CDK application for deploying Chainlink oracle nodes',
  gitignore: ['cdk.out', 'cdk.context.json', '*notes*', '.env'],
  packageName: 'chainlink-infra-cdk', /* The "name" in package.json. */
  entrypoint: 'cdk.ts',
  tsconfig: {
    compilerOptions: {
      noUnusedLocals: false,
    },
  },
  // projectType: ProjectType.li,  /* Which type of project this is (library/app). */
  // release: undefined,                /* Add release management to this project. */
});
project.synth();