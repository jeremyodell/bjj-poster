# 🚀 Deployment Prompt for Next Session

## Deploy ODE-198 CDK Infrastructure to AWS

### Context

Ticket ODE-198 (CDK Infrastructure Setup) is complete - all code is implemented and tested. The CDK stacks are ready to deploy to AWS. This session should handle the actual AWS deployment.

### Current State

✅ **Code Complete:**
- 4 CDK stacks implemented: Database, Storage, API, CDN
- All Lambda handlers defined and configured
- Environment configs for dev and prod
- Deployment scripts ready and executable
- Documentation complete
- **Stripe payment handlers disabled** (no secrets yet - will add later)

⏸️ **Not Yet Done:**
- AWS CDK bootstrap
- Deploy stacks to dev environment
- Verify stack outputs
- Test deployed API endpoints
- Update .env files with deployed resource URLs

### Task

Deploy the BJJ Poster App infrastructure to AWS dev environment:

1. **Bootstrap CDK** (first-time only):
   ```bash
   cd infra
   pnpm cdk bootstrap --context stage=dev
   ```

2. **Deploy all stacks:**
   ```bash
   ./scripts/deploy.sh dev
   ```

3. **Capture stack outputs:**
   ```bash
   pnpm cdk output --all --context stage=dev
   ```

4. **Update environment variables:**
   After deployment, update `.env` file with stack outputs:
   ```bash
   # From DynamoDB Stack
   DYNAMODB_TABLE_NAME=bjj-poster-dev

   # From Storage Stack
   POSTER_BUCKET_NAME=bjj-poster-dev-posters-<hash>
   CDN_URL=https://d<hash>.cloudfront.net

   # From API Stack
   API_URL=https://<id>.execute-api.us-east-1.amazonaws.com/dev

   # Keep these unchanged
   AWS_REGION=us-east-1
   USE_LOCALSTACK=false
   ```

5. **Test deployed endpoints:**
   - Health check: `curl https://<api-url>/health`
   - List templates: `curl https://<api-url>/api/templates`
   - Verify DynamoDB table created (AWS console)
   - Verify S3 bucket created (AWS console)

6. **Update Linear ticket ODE-198:**
   - Add comment with deployment outputs
   - Confirm deployment succeeded
   - Note any issues encountered
   - Mark as "Done"

---

## Prerequisites to Check

Before deploying, verify:
- [ ] AWS CLI configured (`aws configure list`)
- [ ] AWS credentials have CDK permissions
- [ ] Correct AWS account/region (us-east-1)
- [ ] All dependencies installed (`cd infra && pnpm install`)
- [ ] TypeScript compiled (`pnpm build`)

---

## Expected Deployment Time

~5-10 minutes for all 4 stacks (Database, Storage, API, CDN)

---

## What Could Go Wrong

### Common issues:
- **Missing AWS permissions** → Need CDK bootstrap permissions
- **Lambda handler paths incorrect** → Check `apps/api/src/handlers/` structure
- **S3 bucket name collision** → Names must be globally unique
- **CloudFront timeout** → Can take 15-20 minutes to fully propagate

### Rollback plan:
If deployment fails, destroy stacks cleanly:
```bash
./scripts/destroy.sh dev
```

---

## Success Criteria

Deployment is complete when:
- ✅ All 4 stacks show "CREATE_COMPLETE" status
- ✅ API Gateway URL is accessible (returns 200 on /health)
- ✅ DynamoDB table exists in AWS console
- ✅ S3 bucket exists and is accessible
- ✅ Stack outputs captured and documented
- ✅ `.env` file updated with deployed resource URLs

---

## After Deployment

Once dev is working:
1. Seed template data to DynamoDB (if needed)
2. Configure frontend with API Gateway URL
3. Test integration with frontend locally
4. Consider prod deployment (requires ACM certificate for CloudFront)

---

## Stripe Payments - Disabled for Now

⚠️ **Payment handlers are currently commented out** in `apps/api/src/local-server.ts`

**Reason:** Stripe secrets not yet available

**When to enable:**
1. Get Stripe secrets (from other AWS project or new account)
2. Store in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name bjj-poster/stripe \
     --secret-string '{"STRIPE_SECRET_KEY":"sk_...","STRIPE_WEBHOOK_SECRET":"whsec_..."}'
   ```
3. Update CDK to grant Lambda access to secrets
4. Uncomment handlers in `apps/api/src/local-server.ts` (search for "TODO: Uncomment when Stripe secrets")

**Payment endpoints disabled:**
- `POST /api/payments/checkout`
- `POST /api/payments/webhook`

All other endpoints are functional.

---

## Expected Stack Outputs

After deployment, you should see:

**DatabaseStack:**
- `TableName`: bjj-poster-dev
- `TableArn`: arn:aws:dynamodb:us-east-1:...

**StorageStack:**
- `BucketName`: bjj-poster-dev-posters-<hash>
- `CloudFrontURL`: https://d<hash>.cloudfront.net

**ApiStack:**
- `ApiUrl`: https://<id>.execute-api.us-east-1.amazonaws.com/dev

---

## Start Command for Next Session

```
Please deploy the BJJ Poster App infrastructure to AWS:

1. Read docs/plans/HANDOFF-DEPLOYMENT.md for context
2. Verify AWS prerequisites (CLI configured, correct account)
3. Bootstrap CDK for first-time deployment
4. Deploy all stacks to dev environment
5. Capture and document stack outputs
6. Update .env file with deployed resource URLs
7. Test deployed endpoints
8. Update Linear ticket ODE-198 with deployment results

Note: Stripe payment handlers are disabled (no secrets yet). All other endpoints should work.
```

---

## Questions to Answer During Deployment

- [ ] Did all 4 stacks deploy successfully?
- [ ] Are stack outputs correct and accessible?
- [ ] Does API Gateway health check return 200?
- [ ] Are resources tagged correctly (stage=dev)?
- [ ] Is CloudFront distribution deployed (may take 15-20 min)?
- [ ] Are any Lambda functions failing (check CloudWatch logs)?

**Let's deploy the infrastructure to AWS!**
