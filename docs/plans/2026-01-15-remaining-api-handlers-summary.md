# Remaining API Handlers - Quick Reference

## ODE-196: Get User Posters Handler
**Plan:** `2026-01-15-get-user-posters-api-handler.md` (see existing file)
**Key Tasks:** getUserPosters repository method with pagination, handler with cursor support
**TDD:** Write tests for pagination, filtering, user isolation

## ODE-197: User Profile Handler  
**Plan:** `2026-01-15-user-profile-api-handler.md` (see existing file)
**Key Tasks:** getUser, updateLastActive methods, quota calculation
**TDD:** Write tests for profile fetch, quota display, nextResetDate calculation

## ODE-198: CDK Infrastructure
**Plan:** `2026-01-15-cdk-infrastructure-setup.md` (see existing file)
**Key Tasks:** DatabaseStack, StorageStack, ApiStack with all handlers
**Testing:** CDK synth, deploy to dev, verify all endpoints

**Note:** The detailed TDD implementation plans for ODE-196, ODE-197, and ODE-198 follow the same pattern as ODE-194/195:
1. Write failing test
2. Run test (expect FAIL)
3. Implement minimal code
4. Run test (expect PASS)
5. Commit

Refer to the existing plan documents for full implementation details.
