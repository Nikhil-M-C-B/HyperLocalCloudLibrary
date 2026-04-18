# LLM Infrastructure and Platform Services Layer

This document defines the R1 implementation strategy for LLM-backed recommendations/quizzes,
geolocation defaults, CI quality gates, and secure auth/subscription access controls.

## 1) LLM Infrastructure

### Provider Strategy
- Primary provider: Google Gemini (already integrated in backend AI service).
- Secondary provider: AWS-hosted model endpoints (recommended for failover and scale).

### Runtime Configuration
Required environment variables:
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY` (alternative to GEMINI_API_KEY)
- `EMBEDDING_DIMENSION`
- `VECTOR_INDEX_NAME`
- `VECTOR_FIELD`
- `RETRIEVAL_HISTORY_TURNS`
- `RETRIEVAL_HISTORY_CHARS`

### Scaling Recommendations
- Run backend API on autoscaling container runtime (AWS ECS/Fargate or Cloud Run).
- Keep AI calls stateless in request path, and set strict request timeout/retry policy.
- Cache frequent recommendation payloads by `(userId, profileId, branchId)` key for short TTL.
- Move heavy embedding jobs to background queue workers.

## 2) Geolocation Service

Implemented behavior:
- User location source priority:
  1. Default saved delivery address
  2. Legacy delivery address
  3. Device GPS (with permission)
- Libraries endpoint supports `lat` + `lng`, returns distance-aware ordering.
- Order flow now auto-selects the nearest reachable branch by default.

## 3) CI/CD Quality Gate

Added workflow:
- `.github/workflows/coderabbit.yml`

Behavior:
- Triggers on PR opened/synchronize/reopened/ready_for_review
- Invokes CodeRabbit for automated review comments and quality checks

Repository secret needed:
- `CODERABBIT_API_KEY`

## 4) Security/Auth + Subscription Gates

Authentication:
- JWT-protected routes continue to enforce user existence and active account status.

Subscription control:
- Added subscription-aware middleware gate.
- AI recommendation/chat and quiz generation/submission routes now support feature gating.

User model additions:
- `subscription.plan`
- `subscription.status`
- `subscription.currentPeriodEnd`
- `subscription.features.aiRecommendations`
- `subscription.features.aiQuizzes`

## 5) Author/Publisher Open Data Retrieval

Implemented public catalog endpoints backed by Open Library:
- `GET /api/v1/catalog/authors/search?q=...`
- `GET /api/v1/catalog/authors/:authorKey`
- `GET /api/v1/catalog/publishers/search?q=...`
- `GET /api/v1/catalog/publishers/details?name=...`

Frontend pages consume these endpoints for searchable Author and Publisher explorers.
