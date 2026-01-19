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
exports.CdnStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
class CdnStack extends cdk.Stack {
    constructor(scope, id, config, posterBucket, props) {
        super(scope, id, props);
        // Only create CloudFront in production
        if (config.stage !== 'prod') {
            return;
        }
        // Certificate for custom domain (must be in us-east-1)
        // NOTE: You'll need to manually create this in ACM first
        // const certificate = acm.Certificate.fromCertificateArn(
        //   this,
        //   'Certificate',
        //   'arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID'
        // );
        this.distribution = new cloudfront.Distribution(this, 'Distribution', {
            comment: `BJJ Poster App CDN (${config.stage})`,
            defaultBehavior: {
                origin: new origins.S3Origin(posterBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress: true
            },
            // Uncomment when you have a certificate:
            // domainNames: [config.webDomain],
            // certificate: certificate,
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
            enableLogging: true,
            logBucket: posterBucket,
            logFilePrefix: 'cloudfront-logs/',
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3
        });
        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: this.distribution.distributionDomainName,
            exportName: `${config.stage}-DistributionDomainName`
        });
        new cdk.CfnOutput(this, 'DistributionId', {
            value: this.distribution.distributionId,
            exportName: `${config.stage}-DistributionId`
        });
    }
}
exports.CdnStack = CdnStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RuLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RuLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsNEVBQThEO0FBTTlELE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBR3JDLFlBQ0UsS0FBZ0IsRUFDaEIsRUFBVSxFQUNWLE1BQXlCLEVBQ3pCLFlBQXVCLEVBQ3ZCLEtBQXNCO1FBRXRCLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHVDQUF1QztRQUN2QyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDNUIsT0FBTztRQUNULENBQUM7UUFFRCx1REFBdUQ7UUFDdkQseURBQXlEO1FBQ3pELDBEQUEwRDtRQUMxRCxVQUFVO1FBQ1YsbUJBQW1CO1FBQ25CLHdEQUF3RDtRQUN4RCxLQUFLO1FBRUwsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNwRSxPQUFPLEVBQUUsdUJBQXVCLE1BQU0sQ0FBQyxLQUFLLEdBQUc7WUFDL0MsZUFBZSxFQUFFO2dCQUNmLE1BQU0sRUFBRSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO2dCQUMxQyxvQkFBb0IsRUFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCO2dCQUN2RSxjQUFjLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0I7Z0JBQ2hFLGFBQWEsRUFBRSxVQUFVLENBQUMsYUFBYSxDQUFDLHNCQUFzQjtnQkFDOUQsV0FBVyxFQUFFLFVBQVUsQ0FBQyxXQUFXLENBQUMsaUJBQWlCO2dCQUNyRCxRQUFRLEVBQUUsSUFBSTthQUNmO1lBQ0QseUNBQXlDO1lBQ3pDLG1DQUFtQztZQUNuQyw0QkFBNEI7WUFDNUIsVUFBVSxFQUFFLFVBQVUsQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFLG9DQUFvQztZQUN2RixhQUFhLEVBQUUsSUFBSTtZQUNuQixTQUFTLEVBQUUsWUFBWTtZQUN2QixhQUFhLEVBQUUsa0JBQWtCO1lBQ2pDLHNCQUFzQixFQUFFLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxhQUFhO1lBQ3ZFLFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVyxDQUFDLFdBQVc7U0FDaEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRTtZQUNoRCxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxzQkFBc0I7WUFDL0MsVUFBVSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUsseUJBQXlCO1NBQ3JELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYztZQUN2QyxVQUFVLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSyxpQkFBaUI7U0FDN0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBeERELDRCQXdEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgYWNtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBFbnZpcm9ubWVudENvbmZpZyB9IGZyb20gJy4vY29uZmlnL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIENkblN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGRpc3RyaWJ1dGlvbjogY2xvdWRmcm9udC5EaXN0cmlidXRpb247XG5cbiAgY29uc3RydWN0b3IoXG4gICAgc2NvcGU6IENvbnN0cnVjdCxcbiAgICBpZDogc3RyaW5nLFxuICAgIGNvbmZpZzogRW52aXJvbm1lbnRDb25maWcsXG4gICAgcG9zdGVyQnVja2V0OiBzMy5CdWNrZXQsXG4gICAgcHJvcHM/OiBjZGsuU3RhY2tQcm9wc1xuICApIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIE9ubHkgY3JlYXRlIENsb3VkRnJvbnQgaW4gcHJvZHVjdGlvblxuICAgIGlmIChjb25maWcuc3RhZ2UgIT09ICdwcm9kJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENlcnRpZmljYXRlIGZvciBjdXN0b20gZG9tYWluIChtdXN0IGJlIGluIHVzLWVhc3QtMSlcbiAgICAvLyBOT1RFOiBZb3UnbGwgbmVlZCB0byBtYW51YWxseSBjcmVhdGUgdGhpcyBpbiBBQ00gZmlyc3RcbiAgICAvLyBjb25zdCBjZXJ0aWZpY2F0ZSA9IGFjbS5DZXJ0aWZpY2F0ZS5mcm9tQ2VydGlmaWNhdGVBcm4oXG4gICAgLy8gICB0aGlzLFxuICAgIC8vICAgJ0NlcnRpZmljYXRlJyxcbiAgICAvLyAgICdhcm46YXdzOmFjbTp1cy1lYXN0LTE6QUNDT1VOVDpjZXJ0aWZpY2F0ZS9DRVJUX0lEJ1xuICAgIC8vICk7XG5cbiAgICB0aGlzLmRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnRGlzdHJpYnV0aW9uJywge1xuICAgICAgY29tbWVudDogYEJKSiBQb3N0ZXIgQXBwIENETiAoJHtjb25maWcuc3RhZ2V9KWAsXG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5TM09yaWdpbihwb3N0ZXJCdWNrZXQpLFxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFEX09QVElPTlMsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxuICAgICAgICBjb21wcmVzczogdHJ1ZVxuICAgICAgfSxcbiAgICAgIC8vIFVuY29tbWVudCB3aGVuIHlvdSBoYXZlIGEgY2VydGlmaWNhdGU6XG4gICAgICAvLyBkb21haW5OYW1lczogW2NvbmZpZy53ZWJEb21haW5dLFxuICAgICAgLy8gY2VydGlmaWNhdGU6IGNlcnRpZmljYXRlLFxuICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCwgLy8gVXNlIG9ubHkgTm9ydGggQW1lcmljYSBhbmQgRXVyb3BlXG4gICAgICBlbmFibGVMb2dnaW5nOiB0cnVlLFxuICAgICAgbG9nQnVja2V0OiBwb3N0ZXJCdWNrZXQsXG4gICAgICBsb2dGaWxlUHJlZml4OiAnY2xvdWRmcm9udC1sb2dzLycsXG4gICAgICBtaW5pbXVtUHJvdG9jb2xWZXJzaW9uOiBjbG91ZGZyb250LlNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzJfMjAyMSxcbiAgICAgIGh0dHBWZXJzaW9uOiBjbG91ZGZyb250Lkh0dHBWZXJzaW9uLkhUVFAyX0FORF8zXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGlzdHJpYnV0aW9uRG9tYWluTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgICAgZXhwb3J0TmFtZTogYCR7Y29uZmlnLnN0YWdlfS1EaXN0cmlidXRpb25Eb21haW5OYW1lYFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rpc3RyaWJ1dGlvbklkJywge1xuICAgICAgdmFsdWU6IHRoaXMuZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZXhwb3J0TmFtZTogYCR7Y29uZmlnLnN0YWdlfS1EaXN0cmlidXRpb25JZGBcbiAgICB9KTtcbiAgfVxufVxuIl19