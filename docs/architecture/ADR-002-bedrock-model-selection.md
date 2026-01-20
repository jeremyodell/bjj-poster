# ADR-002: Amazon Bedrock Model Selection and Cost Analysis

**Status:** Accepted
**Date:** 2025-01-05
**Decision Makers:** Technical Lead, Team
**Stakeholders:** Backend developers, Product, Finance

---

## Context

The BJJ Poster Builder uses AI for two purposes:

1. **Background Generation** - Generate tournament-themed backgrounds (arena, gym, abstract patterns)
2. **Image Enhancement** - Remove backgrounds from athlete photos, enhance quality

We need to select:
- Which Bedrock foundation models to use
- How to control costs
- Fallback strategies when AI fails
- Quality vs cost trade-offs

### Available Bedrock Image Models (January 2025)

| Model | Provider | Strengths | Cost per Image | Speed |
|-------|----------|-----------|----------------|-------|
| **Stability AI (Stable Diffusion XL)** | Stability AI | High quality, prompt adherence | $0.08 (1024×1024) | ~8-12s |
| **Amazon Titan Image Generator** | Amazon | Lower cost, faster | $0.02 (1024×1024) | ~4-6s |
| **Stability AI (Stable Diffusion 3)** | Stability AI | Latest model, best quality | $0.12 (1024×1024) | ~10-15s |

---

## Decision

### Primary Models

**We will use the following tiered approach:**

1. **Background Generation:** Amazon Titan Image Generator
2. **Background Removal (if needed):** External API (remove.bg) with fallback to manual cropping
3. **Future Enhancement:** Stability Diffusion XL for premium tier only

### Cost Control Measures

1. **Lambda Concurrency Limit:** 5 concurrent poster generation Lambdas (prevents runaway costs)
2. **Pre-generated Template Backgrounds:** Store 20-30 AI-generated backgrounds in S3, reuse randomly
3. **Subscription Tier Limits:**
   - Free: 2 posters/month (pre-generated backgrounds only, no custom generation)
   - Pro ($9.99/mo): 20 posters/month (pre-generated backgrounds)
   - Premium ($29.99/mo): Unlimited posters + custom AI background generation
4. **Spending Alerts:** AWS Budgets alarm at $50/month for Bedrock

---

## Rationale

### Why Titan Image Generator?

| Factor | Titan | Stable Diffusion XL |
|--------|-------|---------------------|
| **Cost per poster** | $0.02 | $0.08 |
| **Speed** | 4-6 seconds | 8-12 seconds |
| **Quality** | Good for backgrounds | Better for detailed art |
| **AWS Native** | ✅ First-party support | ⚠️ Third-party model |
| **Prompt complexity** | Simpler prompts work well | Requires prompt engineering |

**For background generation (simple patterns, gym scenes), Titan's quality is sufficient at 1/4 the cost.**

### Why Pre-generated Backgrounds?

**Cost Analysis - 1000 Posters/Month:**

**Scenario A: Generate backgrounds on-demand**
- 1000 posters × $0.02 per generation = **$20/month**
- Plus: Lambda execution time (~$2)
- **Total: $22/month**

**Scenario B: Pre-generated background library**
- One-time: 30 backgrounds × $0.02 = **$0.60**
- Per poster: Only Lambda image composition (~$0.002)
- 1000 posters × $0.002 = **$2/month**
- **Total: $2.60/month** (after initial generation)

**Savings: $19.40/month (88% reduction)**

For MVP with limited users, pre-generated backgrounds are dramatically cheaper.

### Why Subscription Tiers?

**Free Tier:**
- 2 posters/month with pre-generated backgrounds
- Cost per user: $0.004 (2 × $0.002)
- **Sustainable even with 10,000 free users**

**Pro Tier ($9.99/mo):**
- 20 posters/month with pre-generated backgrounds
- Cost per user: $0.04 (20 × $0.002)
- **Gross margin: 99.6%**

**Premium Tier ($29.99/mo):**
- Unlimited posters + custom AI generation
- Even at 100 posters/month: $2 (custom AI) = **Gross margin: 93%**

---

## Implementation Guide

### Pre-generating Background Library

```bash
# scripts/generate-template-backgrounds.ts
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

const backgroundPrompts = [
  'Professional BJJ tournament arena with blue mats, dramatic lighting, 4K photography',
  'Abstract martial arts background, flowing gi fabric, minimalist, blue and gold',
  'BJJ gym interior, training mats, motivational atmosphere, photorealistic',
  'Tournament podium with medals, competitive sports photography, professional',
  'Dynamic martial arts action blur, blue belt movement, high energy',
  // ... 25 more prompts
];

async function generateBackground(prompt: string, index: number) {
  const modelId = 'amazon.titan-image-generator-v1';

  const payload = {
    taskType: 'TEXT_IMAGE',
    textToImageParams: {
      text: prompt,
      negativeText: 'people, faces, text, watermarks, low quality',
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      height: 1024,
      width: 1024,
      cfgScale: 8.0,
      seed: 42 + index, // Consistent but varied results
    },
  };

  const command = new InvokeModelCommand({
    modelId,
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  // Upload to S3
  const imageBuffer = Buffer.from(responseBody.images[0], 'base64');

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.TEMPLATE_BACKGROUNDS_BUCKET!,
    Key: `backgrounds/template-bg-${index}.png`,
    Body: imageBuffer,
    ContentType: 'image/png',
  }));

  console.log(`Generated background ${index}: ${prompt}`);
}

async function main() {
  console.log('Generating 30 template backgrounds...');
  console.log(`Estimated cost: $${(backgroundPrompts.length * 0.02).toFixed(2)}`);

  for (let i = 0; i < backgroundPrompts.length; i++) {
    await generateBackground(backgroundPrompts[i], i);
    // Rate limit to avoid throttling
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ All backgrounds generated!');
}

main().catch(console.error);
```

Run this script once during infrastructure setup:
```bash
cd scripts
AWS_REGION=us-east-1 tsx generate-template-backgrounds.ts
```

### Template Definition with Background Selection

```typescript
// packages/db/src/types/template.ts
export interface PosterTemplate {
  id: string;
  name: string;
  category: 'tournament' | 'training' | 'promotion' | 'social';

  // Background strategy
  backgroundStrategy: 'pregenerated' | 'custom-ai' | 'solid-color';

  // For pregenerated: randomly select from pool
  backgroundPool?: string[]; // ['template-bg-0.png', 'template-bg-1.png', ...]

  // For custom-ai: use this prompt template
  customPromptTemplate?: string; // 'BJJ tournament for {tournament_name}, {style}'

  // For solid-color: use this hex
  backgroundColor?: string;

  // Layout configuration for Sharp.js
  layout: {
    athletePhoto: { x: number; y: number; width: number; height: number };
    nameText: { x: number; y: number; fontSize: number; color: string };
    tournamentText: { x: number; y: number; fontSize: number; color: string };
    // ... other overlays
  };
}
```

### Poster Generation Lambda with Tiered Logic

```typescript
// apps/api/src/handlers/poster/process-poster.ts
import { SQSHandler } from 'aws-lambda';
import { getTemplateById, getPosterById, updatePoster } from '@bjj-poster/db';
import { generateCustomBackground, compositeImage } from '@bjj-poster/core';

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const { posterId, userId, templateId } = JSON.parse(record.body);

    try {
      const [template, poster, user] = await Promise.all([
        getTemplateById(templateId),
        getPosterById(userId, posterId),
        getUserById(userId),
      ]);

      let backgroundImageUrl: string;

      // Determine background strategy based on template and user tier
      if (template.backgroundStrategy === 'pregenerated') {
        // Select random background from pool
        const randomIndex = Math.floor(Math.random() * template.backgroundPool!.length);
        backgroundImageUrl = `s3://${process.env.TEMPLATE_BACKGROUNDS_BUCKET}/${template.backgroundPool![randomIndex]}`;
      }
      else if (template.backgroundStrategy === 'custom-ai') {
        // Check user subscription tier
        if (user.subscriptionTier !== 'premium') {
          throw new Error('Custom AI backgrounds require Premium subscription');
        }

        // Generate custom background with Bedrock
        const prompt = template.customPromptTemplate!
          .replace('{tournament_name}', poster.tournamentName)
          .replace('{style}', poster.preferredStyle || 'dynamic');

        backgroundImageUrl = await generateCustomBackground(prompt, posterId);
      }
      else {
        // Solid color background (free, instant)
        backgroundImageUrl = template.backgroundColor!;
      }

      // Composite athlete photo onto background with text overlays
      const finalImageUrl = await compositeImage({
        background: backgroundImageUrl,
        athletePhoto: poster.athletePhotoUrl,
        layout: template.layout,
        data: {
          athleteName: poster.athleteName,
          belt: poster.belt,
          team: poster.team,
          tournament: poster.tournamentName,
          date: poster.tournamentDate,
        },
      });

      // Update poster status
      await updatePoster(userId, posterId, {
        status: 'COMPLETED',
        s3Key: finalImageUrl,
        completedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Poster generation failed:', error);

      await updatePoster(userId, posterId, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};
```

### Cost Monitoring and Alerts

```typescript
// infra/lib/stacks/monitoring-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SNS topic for budget alerts
    const alertTopic = new sns.Topic(this, 'BudgetAlerts', {
      displayName: 'BJJ Poster App Budget Alerts',
    });

    alertTopic.addSubscription(
      new subscriptions.EmailSubscription(process.env.ALERT_EMAIL!)
    );

    // Budget for Bedrock spending
    new budgets.CfnBudget(this, 'BedrockBudget', {
      budget: {
        budgetName: 'bedrock-monthly-budget',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 50,
          unit: 'USD',
        },
        costFilters: {
          Service: ['Amazon Bedrock'],
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80, // Alert at 80% of budget
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: process.env.ALERT_EMAIL!,
            },
          ],
        },
      ],
    });
  }
}
```

---

## Consequences

### Positive

✅ **Predictable costs** - Pre-generated backgrounds eliminate variable AI costs for most users
✅ **Fast generation** - Skipping AI generation reduces processing time by 4-6 seconds
✅ **High margins** - 93-99% gross margins on subscriptions
✅ **Scalable** - Can serve 10,000 free users for <$50/month
✅ **Premium upsell** - Custom AI backgrounds create clear premium tier value

### Negative

❌ **Limited customization for free/pro** - Users stuck with template backgrounds
❌ **Initial content creation** - Need to generate and curate 30 backgrounds upfront
❌ **Background variety** - Pre-generated pool may feel repetitive to power users
❌ **Migration complexity** - Moving to custom AI later requires template redesign

### Neutral

⚠️ **Quality trade-off** - Titan vs SDXL is noticeable to AI experts but acceptable to target users
⚠️ **Background refresh needed** - May need to regenerate pool quarterly for freshness

---

## Cost Projections

### Year 1 Projections (Conservative)

| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| Total Users | 100 | 500 | 1,500 | 5,000 |
| Free Users (80%) | 80 | 400 | 1,200 | 4,000 |
| Pro Users (15%) | 15 | 75 | 225 | 750 |
| Premium Users (5%) | 5 | 25 | 75 | 250 |
| **Bedrock Cost** | $1 | $5 | $15 | $50 |
| **Lambda Cost** | $2 | $10 | $30 | $100 |
| **Total Infra** | $8 | $30 | $75 | $250 |
| **MRR** | $200 | $1,000 | $3,000 | $10,000 |
| **Gross Margin** | 96% | 97% | 97.5% | 97.5% |

**Key Insight:** Even at 5,000 users generating 15,000 posters/month, AI costs remain under $50/month.

---

## Future Considerations

### When to Revisit This Decision?

1. **User feedback** - If users consistently request more background variety
2. **Competition** - If competitors offer unlimited custom AI generation
3. **Model pricing changes** - If Bedrock costs drop significantly
4. **Quality complaints** - If Titan quality doesn't meet user expectations
5. **Premium adoption** - If >20% of users choose Premium (validates custom AI demand)

### Alternative Strategies

**Option A: Hybrid Pool**
- Generate 10 new backgrounds weekly, add to pool
- Keeps backgrounds fresh without per-poster generation cost

**Option B: User-uploaded Backgrounds**
- Allow Pro users to upload their own backgrounds (gym logos, etc.)
- Zero AI cost, high personalization

**Option C: Midjourney API**
- Higher quality than Bedrock (~$0.04/image)
- Better prompt adherence for complex scenes

---

## References

- [Amazon Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Titan Image Generator Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-image-models.html)
- [Stable Diffusion XL on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-diffusion-1-0-text-image.html)
- [AWS Budgets for Cost Control](https://aws.amazon.com/aws-cost-management/aws-budgets/)

---

## Review History

| Date | Reviewer | Status | Notes |
|------|----------|--------|-------|
| 2025-01-05 | Team | Accepted | Pre-generated backgrounds for MVP |
