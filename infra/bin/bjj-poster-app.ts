#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';
import { devConfig } from '../lib/config/dev';
import { prodConfig } from '../lib/config/prod';

const app = new cdk.App();

const stage = app.node.tryGetContext('stage') || 'dev';
const config = stage === 'prod' ? prodConfig : devConfig;

const env = {
  account: config.account,
  region: config.region
};

const databaseStack = new DatabaseStack(app, `BjjPosterDatabase-${stage}`, config, { env });
const storageStack = new StorageStack(app, `BjjPosterStorage-${stage}`, config, { env });
const apiStack = new ApiStack(
  app,
  `BjjPosterApi-${stage}`,
  config,
  databaseStack.table,
  storageStack.posterBucket,
  { env }
);

apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);

cdk.Tags.of(app).add('Project', 'BJJ Poster App');
cdk.Tags.of(app).add('Environment', stage);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
