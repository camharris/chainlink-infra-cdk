import { anything, SynthUtils } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import { infraStack } from '../lib/infra-stack';
import { containerStack } from '../lib/container-stack'
import '@aws-cdk/assert/jest';

const stack = new Stack();
var myinfraStack = new infraStack(stack, 'Construct');

test('Test VPC is created', () => {
    expect(myinfraStack).toCountResources('AWS::EC2::VPC', 1)
    expect(myinfraStack).toCountResources('AWS::EC2::Subnet', 4)
});

test('ECS cluster is created', () => {
    expect(myinfraStack).toCountResources('AWS::ECS::Cluster', 1)
})



