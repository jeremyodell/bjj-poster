# GitHub Secrets Setup Guide

**Version 1.0 | January 2026**

This guide walks you through configuring GitHub Secrets for OIDC authentication with AWS. Complete these steps to enable automated deployments to dev and production environments.

---

## Prerequisites

Before setting up GitHub Secrets, you must complete the AWS OIDC setup:

1. ✅ **OIDC Identity Provider** created in AWS IAM
2. ✅ **IAM Roles** created (`GitHubActions-BjjPoster-Dev` and `GitHubActions-BjjPoster-Prod`)
3. ✅ **Trust policies** configured to allow your GitHub repository

If you haven't done this yet, see `docs/guides/ci-cd-pipeline.md` → "AWS Authentication Setup" section (Steps 1-2).

---

## Quick Start

**If you just want the checklist:**

1. Go to GitHub Repo → Settings → Secrets and variables → Actions
2. Add 5 secrets (see table below)
3. Run test workflow: Actions → Test Secrets Configuration
4. ✅ Green checkmark = you're done!

---

## Required Secrets

Add these secrets in **GitHub Repo → Settings → Secrets and Variables → Actions → New repository secret**:

| Secret Name | Value | Where to Find It | Example |
|-------------|-------|------------------|---------|
| **AWS_ACCOUNT_ID** | Your 12-digit AWS account ID | AWS Console → Top-right menu → Account ID | `123456789012` |
| **AWS_REGION** | AWS region for deployments | Choose region (recommend `us-east-1`) | `us-east-1` |
| **AWS_ROLE_ARN_DEV** | Dev IAM role ARN | AWS Console → IAM → Roles → GitHubActions-BjjPoster-Dev → ARN | `arn:aws:iam::123456789012:role/GitHubActions-BjjPoster-Dev` |
| **AWS_ROLE_ARN_PROD** | Prod IAM role ARN | AWS Console → IAM → Roles → GitHubActions-BjjPoster-Prod → ARN | `arn:aws:iam::123456789012:role/GitHubActions-BjjPoster-Prod` |
| **STRIPE_SECRET_KEY_DEV** | Stripe test mode secret key | Stripe Dashboard → Developers → API Keys → Secret key (Test mode) | `sk_test_51...` |

---

## Step-by-Step Instructions

### Step 1: Find Your AWS Account ID

1. Log in to **AWS Console**
2. Click your username in the **top-right corner**
3. Your **12-digit Account ID** is displayed in the dropdown
4. Copy it (e.g., `123456789012`)

**Educational Note:** Every AWS account has a unique 12-digit identifier. This is used to construct resource ARNs and verify you're authenticating to the correct account.

### Step 2: Get IAM Role ARNs

**For Dev Role:**

1. Go to **AWS Console → IAM → Roles**
2. Search for `GitHubActions-BjjPoster-Dev`
3. Click the role name
4. Copy the **ARN** at the top (looks like `arn:aws:iam::123456789012:role/GitHubActions-BjjPoster-Dev`)

**For Prod Role:**

1. Search for `GitHubActions-BjjPoster-Prod`
2. Copy its **ARN**

**Educational Note:** The ARN (Amazon Resource Name) uniquely identifies an AWS resource. It includes your account ID, service (IAM), and resource name (the role).

**⚠️ If roles don't exist:** You need to create them first. See `docs/guides/ci-cd-pipeline.md` → "AWS Authentication Setup" → Step 2.

### Step 3: Get Stripe Secret Key

1. Log in to **Stripe Dashboard**
2. Toggle to **Test mode** (top-right switch)
3. Go to **Developers → API Keys**
4. Find **Secret key** (starts with `sk_test_`)
5. Click **Reveal test key**
6. Copy the key

**Educational Note:** Stripe provides separate keys for test and live modes. Always use test keys for dev environment. Never commit keys to git.

**⚠️ Don't have Stripe account yet?** Skip this for now. You can add it later when payment features are needed.

### Step 4: Add Secrets to GitHub

1. Go to your **GitHub repository**
2. Click **Settings** (top tab)
3. In left sidebar: **Secrets and variables → Actions**
4. Click **New repository secret**

For each secret:

1. **Name:** Enter the exact secret name from the table (e.g., `AWS_ACCOUNT_ID`)
2. **Secret:** Paste the value
3. Click **Add secret**

**Repeat for all 5 secrets.**

**Educational Note:** GitHub encrypts secrets and never exposes them in logs. You can update secrets anytime, but you can't view them after creation (security feature).

### Step 5: Validate Configuration

1. Go to **Actions** tab in your GitHub repo
2. Find **Test Secrets Configuration** workflow in the left sidebar
3. Click **Run workflow** (right side)
4. Select **dev** from the dropdown
5. Click **Run workflow** (green button)

**What happens:**
- Workflow checks all secrets are set
- Attempts OIDC authentication with AWS
- Verifies account ID matches
- Tests CDK can list stacks

**Expected result:** Green checkmark ✅

**If it fails:**
- Click into the failed step to see error
- Common issues:
  - Typo in secret name (must match exactly)
  - Wrong role ARN (copy-paste error)
  - IAM role trust policy doesn't allow your repo
  - OIDC provider not created in AWS

### Step 6: Test Production Secrets

After dev succeeds:

1. Run **Test Secrets Configuration** again
2. Select **prod** this time
3. Verify it passes

**Why test both:** Dev and prod use different IAM roles with different permissions. Testing both ensures complete configuration.

---

## Troubleshooting

### Error: "Credentials could not be loaded"

**Cause:** OIDC authentication failed

**Common reasons:**

1. **IAM role doesn't exist**
   - Go to AWS Console → IAM → Roles
   - Verify `GitHubActions-BjjPoster-Dev` exists
   - Check if ARN in GitHub Secrets matches

2. **Trust policy doesn't allow your repo**
   - Click role in IAM console
   - Go to **Trust relationships** tab
   - Verify trust policy includes your repo path
   - Should look like: `"repo:YOUR_ORG/bjj-poster-app:*"`

3. **OIDC provider not created**
   - Go to AWS Console → IAM → Identity Providers
   - Should see `token.actions.githubusercontent.com`
   - If missing, see ci-cd-pipeline.md → Step 1

**Fix:** Compare trust policy with the template in `ci-cd-pipeline.md`.

### Error: "Account ID mismatch"

**Cause:** `AWS_ACCOUNT_ID` secret doesn't match the account your role is in

**Fix:**
1. Check your AWS account ID in AWS Console (top-right dropdown)
2. Update `AWS_ACCOUNT_ID` secret in GitHub
3. Re-run test workflow

### Secret Already Exists

**When updating a secret:**

1. Go to Secrets page
2. Find existing secret
3. Click **Update**
4. Paste new value
5. Click **Update secret**

**Note:** You can't view existing secret values (security feature). You can only update them.

### Workflow Says "Secret Not Set"

**Cause:** Secret name typo or wasn't saved

**Fix:**
1. Go to Settings → Secrets and variables → Actions
2. Verify all 5 secrets are listed
3. Check spelling matches exactly (case-sensitive)
4. Re-run test workflow

---

## Security Best Practices

### ✅ DO

- **Use OIDC instead of access keys** (we already do this)
- **Rotate Stripe keys quarterly** or when compromised
- **Use test keys for dev environment**
- **Review IAM role permissions** to follow least privilege
- **Enable branch protection** to require PR reviews

### ❌ DON'T

- **Never commit secrets to git** (use GitHub Secrets or environment variables)
- **Never share secrets in Slack, email, or tickets**
- **Don't reuse production keys in dev**
- **Don't grant more permissions than needed**
- **Don't skip the test workflow** - always validate after changes

### Secret Rotation Schedule

| Secret | Rotation Frequency | Notes |
|--------|-------------------|-------|
| `AWS_ROLE_ARN_*` | Only if role renamed | ARNs don't expire |
| `AWS_ACCOUNT_ID` | Never (unless migrating accounts) | Account IDs don't change |
| `AWS_REGION` | Only if changing regions | Rarely changes |
| `STRIPE_SECRET_KEY_DEV` | Quarterly or on compromise | Can regenerate in Stripe dashboard |

**Educational Note:** OIDC credentials automatically expire after 1 hour, so there's nothing to rotate for AWS credentials themselves. The IAM role ARNs are just identifiers, not secrets.

---

## What Happens Next

After secrets are configured:

1. **Merge PR to main** → Triggers `deploy-dev.yml` → Deploys to dev automatically
2. **Create git tag** (e.g., `v1.0.0`) → Triggers `deploy-prod.yml` → Requires manual approval → Deploys to prod

See `docs/guides/ci-cd-pipeline.md` for deployment process details.

---

## FAQ

### Q: What if I don't have a Stripe account yet?

**A:** Skip `STRIPE_SECRET_KEY_DEV` for now. The deployment workflows don't use it yet. Add it when payment features are implemented.

### Q: Can I use the same IAM role for dev and prod?

**A:** No, this violates security best practices. Separate roles provide:
- **Least privilege:** Each role only has permissions for its environment
- **Blast radius containment:** Compromised dev role can't affect prod
- **Audit clarity:** CloudTrail logs show which environment was accessed

### Q: How do I know if OIDC is working?

**A:** Run the test workflow. If you see "OIDC authentication succeeded! 🎉" and a green checkmark, it's working.

### Q: Can other people on my team see the secret values?

**A:** No. GitHub encrypts secrets and never displays them. Even repo admins can only update secrets, not view them.

### Q: What if someone leaves the team?

**A:** Rotate the Stripe key immediately. OIDC credentials are temporary (1 hour) so no action needed for AWS access. Remove their GitHub repo access.

### Q: Do secrets work in forked repos?

**A:** No. GitHub doesn't share secrets with forks (security feature). Contributors need their own AWS setup or use LocalStack for testing.

---

## Checklist

Before marking ODE-201 complete:

- [ ] AWS account ID found and added to GitHub Secrets
- [ ] AWS region set to `us-east-1`
- [ ] Dev IAM role ARN added to GitHub Secrets
- [ ] Prod IAM role ARN added to GitHub Secrets
- [ ] Stripe test key added to GitHub Secrets (or documented as deferred)
- [ ] Test workflow passes for dev environment
- [ ] Test workflow passes for prod environment
- [ ] This guide reviewed and any corrections made
- [ ] Team notified that secrets are configured

---

## Next Steps

1. ✅ **Complete this guide** - Configure all secrets
2. ✅ **Run test workflow** - Verify configuration
3. 🚀 **Test deployment** - Merge a small PR to trigger dev deployment
4. 📋 **Move to ODE-202** - Set up CI/CD workflows (if not already done)

---

**Questions?** Ask in team Slack or create a GitHub issue.

**Found an error in this guide?** PRs welcome! Help us make it better for future team members.
