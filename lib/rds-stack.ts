import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';

export class rdsStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
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
            //credentials: rds.Credentials.fromGeneratedSecret('postgres'),
            vpc,
            vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE
            },
    
        });       

    }
}