export interface EnvironmentConfig {
    stage: 'dev' | 'prod';
    region: string;
    account: string;
    apiDomain: string;
    webDomain: string;
    apiThrottleRate: number;
    apiThrottleBurst: number;
    lambdaMemory: number;
    lambdaTimeout: number;
    dynamoDbBillingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
    posterBucketName: string;
    cognitoUserPoolName: string;
    enableCdn: boolean;
}
