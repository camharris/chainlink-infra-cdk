import { anything, SynthUtils } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import { infraStack } from '../lib/infra-stack';
import { containerStack } from '../lib/container-stack'
import '@aws-cdk/assert/jest';

const stack = new Stack();
var myinfraStack = new infraStack(stack, 'Construct')

const props = {
    vpc: myinfraStack.vpc,
    cluster: myinfraStack.cluster,
    network: 'myTestNet'
  }
  
  var myContainerStack =  new containerStack(stack, 'ContainerStack', props);
  
  test('DB secrets are created', () => {
    expect(myContainerStack).toHaveResource('AWS::SecretsManager::Secret', {
      GenerateSecretString: {
        ExcludePunctuation: true,
        GenerateStringKey: "password",
        IncludeSpace: false,
        SecretStringTemplate: "{\"username\":\"postgres\"}"
      }
    })
  });
  
  test('DB Security Group', () => {
    expect(myContainerStack).toHaveResourceLike('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: "10.0.0.0/16",
          Description: "from 10.0.0.0/16:5432",
          FromPort: 5432,
          IpProtocol: "tcp",
          ToPort: 5432
        }
      ],
    })
  });
  
  test('RDS instance', () => {
    expect(myContainerStack).toHaveResourceLike('AWS::RDS::DBInstance', {
      DBInstanceClass: "db.t3.small",
      AllocatedStorage: "100",
      DBName: "chainlink",
    })
  });

  // Skipping testing for docker image asset, as it doesn't appear in cloudformation

  