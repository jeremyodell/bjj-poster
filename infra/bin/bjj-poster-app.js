#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const database_stack_1 = require("../lib/database-stack");
const storage_stack_1 = require("../lib/storage-stack");
const api_stack_1 = require("../lib/api-stack");
const cdn_stack_1 = require("../lib/cdn-stack");
const dev_1 = require("../lib/config/dev");
const prod_1 = require("../lib/config/prod");
const app = new cdk.App();
const stage = app.node.tryGetContext('stage') || 'dev';
const config = stage === 'prod' ? prod_1.prodConfig : dev_1.devConfig;
const env = {
    account: config.account,
    region: config.region
};
const databaseStack = new database_stack_1.DatabaseStack(app, `BjjPosterDatabase-${stage}`, config, { env });
const storageStack = new storage_stack_1.StorageStack(app, `BjjPosterStorage-${stage}`, config, { env });
const apiStack = new api_stack_1.ApiStack(app, `BjjPosterApi-${stage}`, config, databaseStack.table, storageStack.posterBucket, { env });
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);
const cdnStack = new cdn_stack_1.CdnStack(app, `BjjPosterCdn-${stage}`, config, storageStack.posterBucket, { env });
cdnStack.addDependency(storageStack);
cdk.Tags.of(app).add('Project', 'BJJ Poster App');
cdk.Tags.of(app).add('Environment', stage);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmpqLXBvc3Rlci1hcHAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJiamotcG9zdGVyLWFwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLDBEQUFzRDtBQUN0RCx3REFBb0Q7QUFDcEQsZ0RBQTRDO0FBQzVDLGdEQUE0QztBQUM1QywyQ0FBOEM7QUFDOUMsNkNBQWdEO0FBRWhELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUN2RCxNQUFNLE1BQU0sR0FBRyxLQUFLLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxpQkFBVSxDQUFDLENBQUMsQ0FBQyxlQUFTLENBQUM7QUFFekQsTUFBTSxHQUFHLEdBQUc7SUFDVixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87SUFDdkIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO0NBQ3RCLENBQUM7QUFFRixNQUFNLGFBQWEsR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLHFCQUFxQixLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzVGLE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVksQ0FBQyxHQUFHLEVBQUUsb0JBQW9CLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDekYsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUMzQixHQUFHLEVBQ0gsZ0JBQWdCLEtBQUssRUFBRSxFQUN2QixNQUFNLEVBQ04sYUFBYSxDQUFDLEtBQUssRUFDbkIsWUFBWSxDQUFDLFlBQVksRUFDekIsRUFBRSxHQUFHLEVBQUUsQ0FDUixDQUFDO0FBRUYsUUFBUSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN0QyxRQUFRLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRXJDLE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FDM0IsR0FBRyxFQUNILGdCQUFnQixLQUFLLEVBQUUsRUFDdkIsTUFBTSxFQUNOLFlBQVksQ0FBQyxZQUFZLEVBQ3pCLEVBQUUsR0FBRyxFQUFFLENBQ1IsQ0FBQztBQUVGLFFBQVEsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFckMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ2xELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDM0MsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBEYXRhYmFzZVN0YWNrIH0gZnJvbSAnLi4vbGliL2RhdGFiYXNlLXN0YWNrJztcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gJy4uL2xpYi9zdG9yYWdlLXN0YWNrJztcbmltcG9ydCB7IEFwaVN0YWNrIH0gZnJvbSAnLi4vbGliL2FwaS1zdGFjayc7XG5pbXBvcnQgeyBDZG5TdGFjayB9IGZyb20gJy4uL2xpYi9jZG4tc3RhY2snO1xuaW1wb3J0IHsgZGV2Q29uZmlnIH0gZnJvbSAnLi4vbGliL2NvbmZpZy9kZXYnO1xuaW1wb3J0IHsgcHJvZENvbmZpZyB9IGZyb20gJy4uL2xpYi9jb25maWcvcHJvZCc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbmNvbnN0IHN0YWdlID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnc3RhZ2UnKSB8fCAnZGV2JztcbmNvbnN0IGNvbmZpZyA9IHN0YWdlID09PSAncHJvZCcgPyBwcm9kQ29uZmlnIDogZGV2Q29uZmlnO1xuXG5jb25zdCBlbnYgPSB7XG4gIGFjY291bnQ6IGNvbmZpZy5hY2NvdW50LFxuICByZWdpb246IGNvbmZpZy5yZWdpb25cbn07XG5cbmNvbnN0IGRhdGFiYXNlU3RhY2sgPSBuZXcgRGF0YWJhc2VTdGFjayhhcHAsIGBCampQb3N0ZXJEYXRhYmFzZS0ke3N0YWdlfWAsIGNvbmZpZywgeyBlbnYgfSk7XG5jb25zdCBzdG9yYWdlU3RhY2sgPSBuZXcgU3RvcmFnZVN0YWNrKGFwcCwgYEJqalBvc3RlclN0b3JhZ2UtJHtzdGFnZX1gLCBjb25maWcsIHsgZW52IH0pO1xuY29uc3QgYXBpU3RhY2sgPSBuZXcgQXBpU3RhY2soXG4gIGFwcCxcbiAgYEJqalBvc3RlckFwaS0ke3N0YWdlfWAsXG4gIGNvbmZpZyxcbiAgZGF0YWJhc2VTdGFjay50YWJsZSxcbiAgc3RvcmFnZVN0YWNrLnBvc3RlckJ1Y2tldCxcbiAgeyBlbnYgfVxuKTtcblxuYXBpU3RhY2suYWRkRGVwZW5kZW5jeShkYXRhYmFzZVN0YWNrKTtcbmFwaVN0YWNrLmFkZERlcGVuZGVuY3koc3RvcmFnZVN0YWNrKTtcblxuY29uc3QgY2RuU3RhY2sgPSBuZXcgQ2RuU3RhY2soXG4gIGFwcCxcbiAgYEJqalBvc3RlckNkbi0ke3N0YWdlfWAsXG4gIGNvbmZpZyxcbiAgc3RvcmFnZVN0YWNrLnBvc3RlckJ1Y2tldCxcbiAgeyBlbnYgfVxuKTtcblxuY2RuU3RhY2suYWRkRGVwZW5kZW5jeShzdG9yYWdlU3RhY2spO1xuXG5jZGsuVGFncy5vZihhcHApLmFkZCgnUHJvamVjdCcsICdCSkogUG9zdGVyIEFwcCcpO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ0Vudmlyb25tZW50Jywgc3RhZ2UpO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcbiJdfQ==