import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import { CfnOutput, Fn } from '@aws-cdk/core';

export interface rdsStackProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc
}

export class rdsStack extends cdk.Stack {
    public readonly dbUrl: string

    constructor(scope: cdk.Construct, id: string, props: rdsStackProps) {
        super(scope, id, props);


        // Create secrets
        const postgresqlSecrets = new secretsmanager.Secret(this, 'postgresqlSecrets', {
            secretName: "db-credentials",
            generateSecretString: {
            secretStringTemplate: JSON.stringify({ username: 'postgres' }),
            generateStringKey: 'password',
            excludePunctuation: true,
            includeSpace: false,
            },
        });

        // Create db instance
        const dbinstance = new rds.DatabaseInstance(this, 'Instance', {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_12}),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
            credentials: rds.Credentials.fromSecret(postgresqlSecrets),
            // Exported/Imported vpc
            vpc: props.vpc,
            vpcSubnets: {
              subnetType: ec2.SubnetType.PRIVATE,
            },

        });

        //postgresql://postgres:password@172.17.0.1:5432/chainlink?sslmode=disable
        const dbUrl = Fn.join('', [
          "postgresql://", postgresqlSecrets.secretValueFromJson('username').toString(),":",
          postgresqlSecrets.secretValueFromJson('password').toString(),  "@",
          dbinstance.instanceEndpoint.socketAddress.toString(), "/chainlink?sslmode=disable"
        ]);

        new cdk.CfnOutput(this, "dbUrl", { value: dbUrl });



    }
}
