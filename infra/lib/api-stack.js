"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const nodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const path = __importStar(require("path"));
class ApiStack extends cdk.Stack {
    constructor(scope, id, config, table, posterBucket, props) {
        super(scope, id, props);
        this.api = new apigateway.RestApi(this, 'Api', {
            restApiName: `bjj-poster-app-${config.stage}`,
            description: `BJJ Poster App API (${config.stage})`,
            deployOptions: {
                stageName: config.stage,
                throttlingRateLimit: config.apiThrottleRate,
                throttlingBurstLimit: config.apiThrottleBurst,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: config.stage === 'dev',
                metricsEnabled: true
            },
            defaultCorsPreflightOptions: {
                allowOrigins: config.stage === 'dev'
                    ? ['http://localhost:3000', `https://${config.webDomain}`]
                    : [`https://${config.webDomain}`],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: ['Content-Type', 'Authorization']
            }
        });
        const commonEnv = {
            TABLE_NAME: table.tableName,
            POSTER_BUCKET_NAME: posterBucket.bucketName,
            STAGE: config.stage
        };
        // Generate Poster Lambda
        const generatePosterFn = new nodejs.NodejsFunction(this, 'GeneratePoster', {
            entry: path.join(__dirname, '../../apps/api/src/handlers/posters/generate-poster.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: config.lambdaMemory,
            timeout: cdk.Duration.seconds(config.lambdaTimeout),
            environment: commonEnv
        });
        table.grantReadWriteData(generatePosterFn);
        posterBucket.grantReadWrite(generatePosterFn);
        // Get Templates Lambda
        const getTemplatesFn = new nodejs.NodejsFunction(this, 'GetTemplates', {
            entry: path.join(__dirname, '../../apps/api/src/handlers/templates/get-templates.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 512,
            timeout: cdk.Duration.seconds(10),
            environment: commonEnv
        });
        table.grantReadData(getTemplatesFn);
        // Get User Posters Lambda
        const getUserPostersFn = new nodejs.NodejsFunction(this, 'GetUserPosters', {
            entry: path.join(__dirname, '../../apps/api/src/handlers/posters/get-user-posters.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 512,
            timeout: cdk.Duration.seconds(10),
            environment: commonEnv
        });
        table.grantReadData(getUserPostersFn);
        // Get User Profile Lambda
        const getUserProfileFn = new nodejs.NodejsFunction(this, 'GetUserProfile', {
            entry: path.join(__dirname, '../../apps/api/src/handlers/user/get-profile.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(10),
            environment: commonEnv
        });
        table.grantReadWriteData(getUserProfileFn);
        // API Routes
        const posters = this.api.root.addResource('posters');
        posters.addMethod('POST', new apigateway.LambdaIntegration(generatePosterFn));
        posters.addMethod('GET', new apigateway.LambdaIntegration(getUserPostersFn));
        const templates = this.api.root.addResource('templates');
        templates.addMethod('GET', new apigateway.LambdaIntegration(getTemplatesFn));
        const user = this.api.root.addResource('user');
        const profile = user.addResource('profile');
        profile.addMethod('GET', new apigateway.LambdaIntegration(getUserProfileFn));
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.api.url,
            exportName: `${config.stage}-ApiUrl`
        });
    }
}
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsK0RBQWlEO0FBQ2pELHNFQUF3RDtBQUt4RCwyQ0FBNkI7QUFFN0IsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFHckMsWUFDRSxLQUFnQixFQUNoQixFQUFVLEVBQ1YsTUFBeUIsRUFDekIsS0FBcUIsRUFDckIsWUFBdUIsRUFDdkIsS0FBc0I7UUFFdEIsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUM3QyxXQUFXLEVBQUUsa0JBQWtCLE1BQU0sQ0FBQyxLQUFLLEVBQUU7WUFDN0MsV0FBVyxFQUFFLHVCQUF1QixNQUFNLENBQUMsS0FBSyxHQUFHO1lBQ25ELGFBQWEsRUFBRTtnQkFDYixTQUFTLEVBQUUsTUFBTSxDQUFDLEtBQUs7Z0JBQ3ZCLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxlQUFlO2dCQUMzQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCO2dCQUM3QyxZQUFZLEVBQUUsVUFBVSxDQUFDLGtCQUFrQixDQUFDLElBQUk7Z0JBQ2hELGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxLQUFLLEtBQUssS0FBSztnQkFDeEMsY0FBYyxFQUFFLElBQUk7YUFDckI7WUFDRCwyQkFBMkIsRUFBRTtnQkFDM0IsWUFBWSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEtBQUssS0FBSztvQkFDbEMsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLEVBQUUsV0FBVyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzFELENBQUMsQ0FBQyxDQUFDLFdB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QU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyRCxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDOUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBRTdFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN6RCxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBRTdFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUU3RSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNoQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHO1lBQ25CLFVBQVUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLFNBQVM7U0FDckMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBekdELDRCQXlHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIG5vZGVqcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgRW52aXJvbm1lbnRDb25maWcgfSBmcm9tICcuL2NvbmZpZy90eXBlcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgY2xhc3MgQXBpU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgc2NvcGU6IENvbnN0cnVjdCxcbiAgICBpZDogc3RyaW5nLFxuICAgIGNvbmZpZzogRW52aXJvbm1lbnRDb25maWcsXG4gICAgdGFibGU6IGR5bmFtb2RiLlRhYmxlLFxuICAgIHBvc3RlckJ1Y2tldDogczMuQnVja2V0LFxuICAgIHByb3BzPzogY2RrLlN0YWNrUHJvcHNcbiAgKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICB0aGlzLmFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0FwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBgYmpqLXBvc3Rlci1hcHAtJHtjb25maWcuc3RhZ2V9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiBgQkpKIFBvc3RlciBBcHAgQVBJICgke2NvbmZpZy5zdGFnZX0pYCxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiBjb25maWcuc3RhZ2UsXG4gICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IGNvbmZpZy5hcGlUaHJvdHRsZVJhdGUsXG4gICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiBjb25maWcuYXBpVGhyb3R0bGVCdXJzdCxcbiAgICAgICAgbG9nZ2luZ0xldmVsOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5JTkZPLFxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBjb25maWcuc3RhZ2UgPT09ICdkZXYnLFxuICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGNvbmZpZy5zdGFnZSA9PT0gJ2RldidcbiAgICAgICAgICA/IFsnaHR0cDovL2xvY2FsaG9zdDozMDAwJywgYGh0dHBzOi8vJHtjb25maWcud2ViRG9tYWlufWBdXG4gICAgICAgICAgOiBbYGh0dHBzOi8vJHtjb25maWcud2ViRG9tYWlufWBdLFxuICAgICAgICBhbGxvd01ldGhvZHM6IFsnR0VUJywgJ1BPU1QnLCAnUFVUJywgJ0RFTEVURScsICdPUFRJT05TJ10sXG4gICAgICAgIGFsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjb21tb25FbnYgPSB7XG4gICAgICBUQUJMRV9OQU1FOiB0YWJsZS50YWJsZU5hbWUsXG4gICAgICBQT1NURVJfQlVDS0VUX05BTUU6IHBvc3RlckJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgU1RBR0U6IGNvbmZpZy5zdGFnZVxuICAgIH07XG5cbiAgICAvLyBHZW5lcmF0ZSBQb3N0ZXIgTGFtYmRhXG4gICAgY29uc3QgZ2VuZXJhdGVQb3N0ZXJGbiA9IG5ldyBub2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dlbmVyYXRlUG9zdGVyJywge1xuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9hcHBzL2FwaS9zcmMvaGFuZGxlcnMvcG9zdGVycy9nZW5lcmF0ZS1wb3N0ZXIudHMnKSxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgbWVtb3J5U2l6ZTogY29uZmlnLmxhbWJkYU1lbW9yeSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKGNvbmZpZy5sYW1iZGFUaW1lb3V0KSxcbiAgICAgIGVudmlyb25tZW50OiBjb21tb25FbnZcbiAgICB9KTtcblxuICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZW5lcmF0ZVBvc3RlckZuKTtcbiAgICBwb3N0ZXJCdWNrZXQuZ3JhbnRSZWFkV3JpdGUoZ2VuZXJhdGVQb3N0ZXJGbik7XG5cbiAgICAvLyBHZXQgVGVtcGxhdGVzIExhbWJkYVxuICAgIGNvbnN0IGdldFRlbXBsYXRlc0ZuID0gbmV3IG5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnR2V0VGVtcGxhdGVzJywge1xuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9hcHBzL2FwaS9zcmMvaGFuZGxlcnMvdGVtcGxhdGVzL2dldC10ZW1wbGF0ZXMudHMnKSxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgZW52aXJvbm1lbnQ6IGNvbW1vbkVudlxuICAgIH0pO1xuXG4gICAgdGFibGUuZ3JhbnRSZWFkRGF0YShnZXRUZW1wbGF0ZXNGbik7XG5cbiAgICAvLyBHZXQgVXNlciBQb3N0ZXJzIExhbWJkYVxuICAgIGNvbnN0IGdldFVzZXJQb3N0ZXJzRm4gPSBuZXcgbm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZXRVc2VyUG9zdGVycycsIHtcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vYXBwcy9hcGkvc3JjL2hhbmRsZXJzL3Bvc3RlcnMvZ2V0LXVzZXItcG9zdGVycy50cycpLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgICBlbnZpcm9ubWVudDogY29tbW9uRW52XG4gICAgfSk7XG5cbiAgICB0YWJsZS5ncmFudFJlYWREYXRhKGdldFVzZXJQb3N0ZXJzRm4pO1xuXG4gICAgLy8gR2V0IFVzZXIgUHJvZmlsZSBMYW1iZGFcbiAgICBjb25zdCBnZXRVc2VyUHJvZmlsZUZuID0gbmV3IG5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnR2V0VXNlclByb2ZpbGUnLCB7XG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2FwcHMvYXBpL3NyYy9oYW5kbGVycy91c2VyL2dldC1wcm9maWxlLnRzJyksXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAgIGVudmlyb25tZW50OiBjb21tb25FbnZcbiAgICB9KTtcblxuICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShnZXRVc2VyUHJvZmlsZUZuKTtcblxuICAgIC8vIEFQSSBSb3V0ZXNcbiAgICBjb25zdCBwb3N0ZXJzID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncG9zdGVycycpO1xuICAgIHBvc3RlcnMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2VuZXJhdGVQb3N0ZXJGbikpO1xuICAgIHBvc3RlcnMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRVc2VyUG9zdGVyc0ZuKSk7XG5cbiAgICBjb25zdCB0ZW1wbGF0ZXMgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCd0ZW1wbGF0ZXMnKTtcbiAgICB0ZW1wbGF0ZXMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRUZW1wbGF0ZXNGbikpO1xuXG4gICAgY29uc3QgdXNlciA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3VzZXInKTtcbiAgICBjb25zdCBwcm9maWxlID0gdXNlci5hZGRSZXNvdXJjZSgncHJvZmlsZScpO1xuICAgIHByb2ZpbGUuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRVc2VyUHJvZmlsZUZuKSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpVXJsJywge1xuICAgICAgdmFsdWU6IHRoaXMuYXBpLnVybCxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2NvbmZpZy5zdGFnZX0tQXBpVXJsYFxuICAgIH0pO1xuICB9XG59XG4iXX0=