import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';
export declare class StorageStack extends cdk.Stack {
    readonly posterBucket: s3.Bucket;
    constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps);
}
