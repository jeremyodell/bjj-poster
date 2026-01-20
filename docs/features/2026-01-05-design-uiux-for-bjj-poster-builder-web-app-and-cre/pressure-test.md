# Pressure Test: UI/UX for BJJ Poster Builder Web App

**Date:** 2026-01-05
**Sign-off:** Confirmed
**Timestamp:** 2026-01-05T21:30:00Z

## Original Idea

Design UI/UX for BJJ Poster Builder web app and create detailed Linear stories for the Poster Creation epic (US-010 to US-016). Focus on: user flows from landing page through poster creation and download, component architecture with Next.js 14 + shadcn/ui, multi-step vs single-page builder UX, state management approach, and breaking into small implementable stories like the IMG epic format. Target: non-technical BJJ athletes, mobile-first, <5 min poster creation.

---

## Scope Drift Check

**Status:** ✓ No scope drift - all components justified

| Component | Status | Rationale |
|-----------|--------|-----------|
| Landing page design | ✓ Essential | Directly addresses user flows requirement |
| Poster builder UX (hybrid) | ✓ Essential | Solves multi-step vs single-page decision |
| Component architecture | ✓ Essential | Directly addresses architecture requirement |
| State management (Zustand) | ✓ Essential | Solves state management approach |
| Mobile-first patterns | ✓ Essential | Addresses mobile-first target |
| Photo upload flow | ✓ Essential | Core poster creation flow |
| Template selection | ✓ Essential | Core poster creation flow |
| Success/download screen | ✓ Essential | Addresses download flow |
| Dashboard design | ✓ Essential | Poster creation epic scope |
| Pricing page | ✓ Essential | Related to subscription tiers (ADR-004), conversion critical |
| Onboarding wizard | ✓ Essential | Critical for first-time user success |
| Error handling patterns | ✓ Essential | Necessary for production quality |
| Accessibility/Performance | ✓ Essential | Best practices, production requirements |

**User confirmation:** "i need all of them"

---

## Assumptions Challenged

### Assumption 1: Users want to create posters in <5 minutes
**Challenge:** What if users want more customization and 15-20 minutes is acceptable?

**Response:** "this is fine for mvp i have plans to offer animated posters"

**Validation:** ✓ <5min is appropriate for MVP, advanced features (animated posters) planned for future

---

### Assumption 2: Smart template recommendations (3 suggested) are better than showing all
**Challenge:** What if users feel limited or want to see all options immediately?

**Response:** "they are able to navigate to others, showing the first three is desired"

**Validation:** ✓ Hybrid approach (3 recommended + browse all) addresses both needs

---

### Assumption 3: Camera-first photo upload is better than file picker
**Challenge:** What if users already have saved photos and camera-first adds friction?

**Response:** "I agree with you. But i thought it was an option where they can choose camera or from their file system. you are probably right camera first is probably not as useful"

**Validation:** ✓ Design offers BOTH options (camera OR file picker), not camera-only. Naming clarified.

---

### Assumption 4: Share-first success screen will drive viral growth
**Challenge:** What if users just want to download and sharing feels pushy?

**Response:** "they want to share, that is the whole point"

**Validation:** ✓ Sharing is core to product purpose, success screen appropriate

---

### Assumption 5: Zustand is simpler for junior devs than Context
**Challenge:** What if external store adds confusion vs React's built-in patterns?

**Response:** "this will be fine"

**Validation:** ✓ Team comfortable with Zustand approach

---

## Risks & Mitigations

**Status:** All risks acknowledged for future mitigation

| Risk | Severity | Status |
|------|----------|--------|
| Image upload failures on poor mobile networks | High | Acknowledged |
| Template rendering performance on older devices | Medium | Acknowledged |
| Bedrock API rate limits/cost overruns | High | Acknowledged |
| Junior dev learning curve with Zustand | Medium | Acknowledged |
| Background removal quality on complex backgrounds | Medium | Acknowledged |
| Stripe webhook reliability | High | Acknowledged |
| Mobile browser compatibility (camera, upload) | Medium | Acknowledged |

**User decision:** "i am going to accept the risks. let just note them so we can go back to them later"

---

## YAGNI Decisions

### Essential (v1 scope):
1. Landing page with hero section
2. Quick start wizard (onboarding)
3. Smart template recommendations
4. Camera photo upload option (+ file picker)
5. Background removal for Pro/Premium
6. Share-first success screen with social buttons
7. Dashboard with filter/sort
8. Upgrade modal with poster showcase
9. Loading animations with rotating tips
10. Pull-to-refresh on dashboard

### Deferred (future versions):
11. Offline mode support
12. Analytics events tracking

**Rationale:** Core user experience and conversion features are essential for MVP. Analytics and offline can be added post-launch based on usage data.

---

## Edge Cases

### 1. User uploads photo but internet cuts out during generation
**Response:** "error that they need to have connection"

**Mitigation:** Display clear error message indicating connection required, allow retry

---

### 2. Bedrock takes 60+ seconds (timeout) to generate
**Response:** "i dont know"

**Mitigation:** TBD during implementation - consider email notification or retry queue

---

### 3. User hits "Generate" multiple times rapidly
**Response:** "we need to not allow that in the ui. and then protect it on the backend"

**Mitigation:** Disable button on click (UI) + idempotency key checks (backend)

---

### 4. Free user bypasses quota check with dev tools
**Response:** "catch on the backend"

**Mitigation:** Backend validation of quota, never trust client-side checks

---

### 5. Templates fail to load on builder page
**Response:** "alert sent to dev team. note to user. attempt to recover automatically"

**Mitigation:** Error monitoring, user-friendly message, show cached default templates

---

### 6. Subscription expires during poster generation
**Response:** "probably not an issue. we can leave that"

**Mitigation:** Accepted - allow generation to complete, apply new tier on next creation

---

## Validation Summary

✅ **Design validated and ready for implementation planning**

- Scope: Comprehensive, no drift, all components justified
- Assumptions: 5 challenged and validated
- Risks: 7 identified and acknowledged for future mitigation
- YAGNI: 10 essential features, 2 deferred to post-MVP
- Edge cases: 6 scenarios addressed with mitigation strategies

**Next step:** Create implementation plan breaking design into detailed Linear stories
