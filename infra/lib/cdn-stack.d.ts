import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';
export declare class CdnStack extends cdk.Stack {
    readonly distribution: cloudfront.Distribution;
    constructor(scope: Construct, id: string, config: EnvironmentConfig, posterBucket: s3.Bucket, props?: cdk.StackProps);
}
