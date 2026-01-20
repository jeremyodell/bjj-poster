# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting key technical and business decisions for the BJJ Poster Builder project.

## What are ADRs?

ADRs capture important architectural decisions along with their context and consequences. They serve as:
- **Historical record** - Why we made certain choices
- **Onboarding guide** - Help new team members understand the system
- **Discussion artifact** - Document trade-offs and alternatives considered
- **Change management** - Understand impact of future changes

## Index

| ADR | Title | Status | Date | Summary |
|-----|-------|--------|------|---------|
| [001](./ADR-001-poster-status-updates.md) | Poster Status Updates: Polling vs WebSocket | Accepted | 2025-01-05 | Use HTTP polling for MVP; defer WebSocket to post-launch |
| [002](./ADR-002-bedrock-model-selection.md) | Bedrock Model Selection and Cost Analysis | Accepted | 2025-01-05 | Use Titan Image Generator with pre-generated backgrounds for cost efficiency |
| [003](./ADR-003-template-definition-format.md) | Template Definition Format | Accepted | 2025-01-05 | JSON-based templates with TypeScript interfaces for type safety |
| [004](./ADR-004-subscription-tiers.md) | Subscription Tier Specifications | Accepted | 2025-01-05 | Three-tier model: Free ($0), Pro ($9.99), Premium ($29.99) |

## Decision Status

- **Proposed** - Under discussion, not yet approved
- **Accepted** - Approved and being implemented
- **Deprecated** - No longer relevant, superseded by another ADR
- **Superseded** - Replaced by a newer decision (link to replacement)

## ADR Template

When creating new ADRs, use this structure:

```markdown
# ADR-XXX: [Title]

**Status:** [Proposed|Accepted|Deprecated|Superseded]
**Date:** YYYY-MM-DD
**Decision Makers:** [Who was involved]
**Stakeholders:** [Who is affected]

---

## Context

[What is the issue we're facing? What constraints exist?]

## Decision

[What have we decided to do?]

## Rationale

[Why did we make this decision? What alternatives did we consider?]

## Consequences

### Positive
[What benefits does this bring?]

### Negative
[What downsides or risks exist?]

### Neutral
[What other impacts should we be aware of?]

---

## Review History

| Date | Reviewer | Status | Notes |
|------|----------|--------|-------|
| YYYY-MM-DD | Name | Accepted | Initial acceptance |
```

## Creating New ADRs

1. **Identify the decision** - Is this a significant architectural choice?
2. **Assign a number** - Use next sequential number (ADR-005, ADR-006, etc.)
3. **Write the ADR** - Use the template above
4. **Discuss with team** - Review in PR or team meeting
5. **Mark as Accepted** - Once consensus is reached
6. **Update this README** - Add to the index table

## When to Create an ADR

Create ADRs for decisions that:
- ✅ Affect system architecture or core technology choices
- ✅ Have significant cost implications
- ✅ Impact team workflow or development practices
- ✅ Require explanation of trade-offs to future team members
- ✅ Are difficult to reverse once implemented

Don't create ADRs for:
- ❌ Routine bug fixes or minor features
- ❌ Code style preferences (use linter configs instead)
- ❌ Temporary workarounds or experiments

## Related Documentation

- [Main Project Plan](../BJJ_Photo_Builder_Project_Plan.md) - Overall project scope and phases
- [Getting Started Guide](../onboarding/getting-started.md) - Developer onboarding
- [Lambda Handler Guide](../guides/creating-lambda-handlers.md) - Implementation patterns

---

## Questions?

If you have questions about any architectural decisions or want to propose changes:
1. Review the relevant ADR to understand the original context
2. Open a GitHub Discussion or PR with your proposal
3. Reference the ADR you're questioning or updating
4. Include new context or data that has changed since the original decision
