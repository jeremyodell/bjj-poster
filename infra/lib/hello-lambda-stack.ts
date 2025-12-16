import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface HelloLambdaStackProps extends cdk.StackProps {
  stage: string;
}

export class HelloLambdaStack extends cdk.Stack {
  public readonly apiUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: HelloLambdaStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // ============================================
    // DynamoDB Table (single-table design)
    // ============================================
    const table = new dynamodb.Table(this, 'MainTable', {
      tableName: `bjj-poster-app-${stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy:
        stage === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for alternative access patterns
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // ============================================
    // Lambda Functions
    // ============================================

    // Shared environment variables for all Lambdas
    const sharedEnv = {
      NODE_ENV: stage === 'prod' ? 'production' : 'development',
      STAGE: stage,
      DYNAMODB_TABLE_NAME: table.tableName,
    };

    // Hello Lambda (simple example)
    const helloFunction = new lambda.Function(this, 'HelloFunction', {
      functionName: `bjj-poster-hello-${stage}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../apps/api/dist/hello')
      ),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: sharedEnv,
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Simple hello world Lambda',
    });

    // List Templates Lambda (uses DynamoDB)
    const listTemplatesFunction = new lambda.Function(
      this,
      'ListTemplatesFunction',
      {
        functionName: `bjj-poster-list-templates-${stage}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'list-templates.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, '../../apps/api/dist/templates')
        ),
        memorySize: 256,
        timeout: cdk.Duration.seconds(10),
        environment: sharedEnv,
        logRetention: logs.RetentionDays.ONE_WEEK,
        description: 'List poster templates from DynamoDB',
      }
    );

    // Grant DynamoDB read access to list-templates
    table.grantReadData(listTemplatesFunction);

    // ============================================
    // API Gateway
    // ============================================
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: `bjj-poster-api-${stage}`,
      description: 'BJJ Poster App API',
      deployOptions: {
        stageName: stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // GET /hello
    const helloResource = api.root.addResource('hello');
    helloResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(helloFunction)
    );

    // GET /templates
    const templatesResource = api.root.addResource('templates');
    templatesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listTemplatesFunction)
    );

    // ============================================
    // Outputs
    // ============================================
    this.apiUrl = new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `BjjPoster-ApiUrl-${stage}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'HelloEndpoint', {
      value: `${api.url}hello`,
      description: 'Hello endpoint URL',
    });

    new cdk.CfnOutput(this, 'TemplatesEndpoint', {
      value: `${api.url}templates`,
      description: 'Templates endpoint URL',
    });
  }
}
