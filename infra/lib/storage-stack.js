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
exports.StorageStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
class StorageStack extends cdk.Stack {
    constructor(scope, id, config, props) {
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
exports.StorageStack = StorageStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0b3JhZ2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUl6QyxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUd6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLE1BQXlCLEVBQUUsS0FBc0I7UUFDekYsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0RCxVQUFVLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtZQUNuQyxTQUFTLEVBQUUsS0FBSztZQUNoQixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsRUFBRSxFQUFFLG1CQUFtQjtvQkFDdkIsT0FBTyxFQUFFLElBQUk7b0JBQ2IsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2lCQUNuRDtnQkFDRDtvQkFDRSx5Q0FBeUM7b0JBQ3pDLG1FQUFtRTtvQkFDbkUsNkRBQTZEO29CQUM3RCxFQUFFLEVBQUUsd0JBQXdCO29CQUM1QixPQUFPLEVBQUUsSUFBSTtvQkFDYixNQUFNLEVBQUUsVUFBVTtvQkFDbEIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDakM7Z0JBQ0Q7b0JBQ0Usb0RBQW9EO29CQUNwRCwwREFBMEQ7b0JBQzFELEVBQUUsRUFBRSxpQ0FBaUM7b0JBQ3JDLE9BQU8sRUFBRSxJQUFJO29CQUNiLG1DQUFtQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDMUQ7YUFDRjtZQUNELGFBQWEsRUFBRSxNQUFNLENBQUMsS0FBSyxLQUFLLEtBQUs7Z0JBQ25DLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87Z0JBQzNCLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07WUFDNUIsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLEtBQUssS0FBSyxLQUFLO1lBQ3pDLElBQUksRUFBRTtnQkFDSjtvQkFDRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQztvQkFDeEQsY0FBYyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEtBQUssS0FBSzt3QkFDcEMsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLEVBQUUsV0FBVyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQzFELENBQUMsQ0FBQyxDQUFDLFdBQVcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNuQyxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ3JCLE1BQU0sRUFBRSxJQUFJO2lCQUNiO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzFDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVU7WUFDbkMsVUFBVSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssbUJBQW1CO1NBQy9DLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUztZQUNsQyxVQUFVLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSyxrQkFBa0I7U0FDOUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBN0RELG9DQTZEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBFbnZpcm9ubWVudENvbmZpZyB9IGZyb20gJy4vY29uZmlnL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBwb3N0ZXJCdWNrZXQ6IHMzLkJ1Y2tldDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBjb25maWc6IEVudmlyb25tZW50Q29uZmlnLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICB0aGlzLnBvc3RlckJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1Bvc3RlckJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGNvbmZpZy5wb3N0ZXJCdWNrZXROYW1lLFxuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ0RlbGV0ZU9sZFZlcnNpb25zJyxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoMzApXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAvLyBDbGVhbiB1cCBvcnBoYW5lZCB1cGxvYWRzIGFmdGVyIDcgZGF5c1xuICAgICAgICAgIC8vIFVwbG9hZHMgYXJlIHRlbXBvcmFyeSBmaWxlcyB0aGF0IHNob3VsZCBiZSBwcm9jZXNzZWQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAvLyBJZiB0aGV5IHN0aWxsIGV4aXN0IGFmdGVyIDcgZGF5cywgdGhleSBhcmUgbGlrZWx5IG9ycGhhbmVkXG4gICAgICAgICAgaWQ6ICdDbGVhbnVwT3JwaGFuZWRVcGxvYWRzJyxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHByZWZpeDogJ3VwbG9hZHMvJyxcbiAgICAgICAgICBleHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cyg3KVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgLy8gQ2xlYW4gdXAgaW5jb21wbGV0ZSBtdWx0aXBhcnQgdXBsb2FkcyBhZnRlciAxIGRheVxuICAgICAgICAgIC8vIFRoZXNlIGNhbiBhY2N1bXVsYXRlIGlmIHVwbG9hZCByZXF1ZXN0cyBhcmUgaW50ZXJydXB0ZWRcbiAgICAgICAgICBpZDogJ0Fib3J0SW5jb21wbGV0ZU11bHRpcGFydFVwbG9hZHMnLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgYWJvcnRJbmNvbXBsZXRlTXVsdGlwYXJ0VXBsb2FkQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDEpXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICByZW1vdmFsUG9saWN5OiBjb25maWcuc3RhZ2UgPT09ICdkZXYnXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiBjb25maWcuc3RhZ2UgPT09ICdkZXYnLFxuICAgICAgY29yczogW1xuICAgICAgICB7XG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtzMy5IdHRwTWV0aG9kcy5HRVQsIHMzLkh0dHBNZXRob2RzLlBVVF0sXG4gICAgICAgICAgYWxsb3dlZE9yaWdpbnM6IGNvbmZpZy5zdGFnZSA9PT0gJ2RldidcbiAgICAgICAgICAgID8gWydodHRwOi8vbG9jYWxob3N0OjMwMDAnLCBgaHR0cHM6Ly8ke2NvbmZpZy53ZWJEb21haW59YF1cbiAgICAgICAgICAgIDogW2BodHRwczovLyR7Y29uZmlnLndlYkRvbWFpbn1gXSxcbiAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXG4gICAgICAgICAgbWF4QWdlOiAzMDAwXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQb3N0ZXJCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMucG9zdGVyQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBleHBvcnROYW1lOiBgJHtjb25maWcuc3RhZ2V9LVBvc3RlckJ1Y2tldE5hbWVgXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUG9zdGVyQnVja2V0QXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMucG9zdGVyQnVja2V0LmJ1Y2tldEFybixcbiAgICAgIGV4cG9ydE5hbWU6IGAke2NvbmZpZy5zdGFnZX0tUG9zdGVyQnVja2V0QXJuYFxuICAgIH0pO1xuICB9XG59XG4iXX0=