import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface HelloLambdaStackProps extends cdk.StackProps {
    stage: string;
}
export declare class HelloLambdaStack extends cdk.Stack {
    readonly apiUrl: cdk.CfnOutput;
    constructor(scope: Construct, id: string, props: HelloLambdaStackProps);
}
export {};
