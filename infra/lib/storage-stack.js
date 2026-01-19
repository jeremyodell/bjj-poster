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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0b3JhZ2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUl6QyxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUd6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLE1BQXlCLEVBQUUsS0FBc0I7UUFDekYsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0RCxVQUFVLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtZQUNuQyxTQUFTLEVBQUUsS0FBSztZQUNoQixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsRUFBRSxFQUFFLG1CQUFtQjtvQkFDdkIsT0FBTyxFQUFFLElBQUk7b0JBQ2IsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2lCQUNuRDthQUNGO1lBQ0QsYUFBYSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEtBQUssS0FBSztnQkFDbkMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztnQkFDM0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUM1QixpQkFBaUIsRUFBRSxNQUFNLENBQUMsS0FBSyxLQUFLLEtBQUs7WUFDekMsSUFBSSxFQUFFO2dCQUNKO29CQUNFLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO29CQUN4RCxjQUFjLEVBQUUsTUFBTSxDQUFDLEtBQUssS0FBSyxLQUFLO3dCQUNwQyxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDMUQsQ0FBQyxDQUFDLENBQUMsV0FBVyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ25DLGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDckIsTUFBTSxFQUFFLElBQUk7aUJBQ2I7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDMUMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVTtZQUNuQyxVQUFVLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSyxtQkFBbUI7U0FDL0MsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUN6QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTO1lBQ2xDLFVBQVUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLGtCQUFrQjtTQUM5QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE3Q0Qsb0NBNkNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IEVudmlyb25tZW50Q29uZmlnIH0gZnJvbSAnLi9jb25maWcvdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgU3RvcmFnZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHBvc3RlckJ1Y2tldDogczMuQnVja2V0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIGNvbmZpZzogRW52aXJvbm1lbnRDb25maWcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIHRoaXMucG9zdGVyQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnUG9zdGVyQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogY29uZmlnLnBvc3RlckJ1Y2tldE5hbWUsXG4gICAgICB2ZXJzaW9uZWQ6IGZhbHNlLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnRGVsZXRlT2xkVmVyc2lvbnMnLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cygzMClcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNvbmZpZy5zdGFnZSA9PT0gJ2RldidcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IGNvbmZpZy5zdGFnZSA9PT0gJ2RldicsXG4gICAgICBjb3JzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogW3MzLkh0dHBNZXRob2RzLkdFVCwgczMuSHR0cE1ldGhvZHMuUFVUXSxcbiAgICAgICAgICBhbGxvd2VkT3JpZ2luczogY29uZmlnLnN0YWdlID09PSAnZGV2J1xuICAgICAgICAgICAgPyBbJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsIGBodHRwczovLyR7Y29uZmlnLndlYkRvbWFpbn1gXVxuICAgICAgICAgICAgOiBbYGh0dHBzOi8vJHtjb25maWcud2ViRG9tYWlufWBdLFxuICAgICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgICAgICBtYXhBZ2U6IDMwMDBcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1Bvc3RlckJ1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5wb3N0ZXJCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2NvbmZpZy5zdGFnZX0tUG9zdGVyQnVja2V0TmFtZWBcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQb3N0ZXJCdWNrZXRBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5wb3N0ZXJCdWNrZXQuYnVja2V0QXJuLFxuICAgICAgZXhwb3J0TmFtZTogYCR7Y29uZmlnLnN0YWdlfS1Qb3N0ZXJCdWNrZXRBcm5gXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==