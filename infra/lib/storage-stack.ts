import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';

export class StorageStack extends cdk.Stack {
  public readonly posterBucket: s3.Bucket;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    this.posterBucket = new s3.Bucket(this, 'PosterBucket', {
      bucketName: config.posterBucketName,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30)
        },
        {
          // Clean up orphaned uploads after 7 days
          // Uploads are temporary files that should be processed immediately
          // If they still exist after 7 days, they are likely orphaned
          id: 'CleanupOrphanedUploads',
          enabled: true,
          prefix: 'uploads/',
          expiration: cdk.Duration.days(7)
        },
        {
          // Clean up incomplete multipart uploads after 1 day
          // These can accumulate if upload requests are interrupted
          id: 'AbortIncompleteMultipartUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1)
        }
      ],
      removalPolicy: config.stage === 'dev'
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: config.stage === 'dev',
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: config.stage === 'dev'
            ? ['http://localhost:3000', `https://${config.webDomain}`]
            : [`https://${config.webDomain}`],
          allowedHeaders: ['*'],
          maxAge: 3000
        }
      ]
    });

    new cdk.CfnOutput(this, 'PosterBucketName', {
      value: this.posterBucket.bucketName,
      exportName: `${config.stage}-PosterBucketName`
    });

    new cdk.CfnOutput(this, 'PosterBucketArn', {
      value: this.posterBucket.bucketArn,
      exportName: `${config.stage}-PosterBucketArn`
    });
  }
}
