# Future Work

WildAtlas is currently a demo prototype: no backend, no persistence, no auth, no tests, no deployment. The list below is what a production version would need.

## Backend & Data
- **API server**: FastAPI (Python) or Node.js + Express, REST + OpenAPI
- **Primary store**: PostgreSQL with PostGIS for geo queries (radius searches, bounding-box filters, clustering)
- **Cache**: Redis for hot reads (recent sightings feed, species filter counts)
- **Object storage**: AWS S3 (or Cloudflare R2) for user-uploaded photos with signed-URL access
- **Background jobs**: Celery (Python) or BullMQ (Node) for image preprocessing and async species ID

## Identity & Trust
- **Auth**: OAuth (Google, GitHub) via Clerk or Auth0; email/password fallback
- **Roles**: contributor, moderator, admin
- **Anti-abuse**: rate limiting, image moderation (NSFW detection), duplicate-photo detection

## Species ID Pipeline
- **MVP**: continue using iNaturalist Computer Vision API
- **V2**: custom TensorFlow / PyTorch model trained on regional data (Texas Panhandle birds, plants, mammals); periodic retraining as users correct predictions
- **Confidence thresholds**: only auto-accept predictions ≥ 90% confidence; route lower-confidence predictions to community review

## Migration Data
- **Source upgrade**: pull live data from BirdCast, eBird Status & Trends API, or GBIF occurrence records
- **More species**: extend beyond American Robin to other migratory species native to West Texas
- **Time granularity**: weekly buckets in addition to monthly

## Engagement
- **Badges & gamification**: "10 sightings", "5 unique species", "First plant report", seasonal challenges
- **Activity feed**: per-user profile pages, follow other observers
- **Notifications**: email or push when species you reported gets confirmed by the community

## Reliability & Operations
- **Containers**: Dockerfile per service, Docker Compose for local dev
- **Deployment**: Kubernetes (EKS or GKE) or simpler PaaS (Fly.io, Railway) initially
- **CI/CD**: GitHub Actions — lint, test, build, deploy on merge to main
- **Observability**: structured logs (JSON), metrics (Prometheus + Grafana), error tracking (Sentry)
- **Backups**: nightly Postgres dumps to S3 with point-in-time recovery

## Quality
- **Tests**: Jest (frontend), Pytest (backend), Cypress / Playwright (E2E); target ≥ 80% coverage
- **Type safety**: migrate frontend to TypeScript; backend already type-hinted (Python) or TS (Node)
- **Accessibility**: keyboard navigation, ARIA labels, color-contrast audit, screen-reader testing

## Mobile
- **Progressive Web App**: installable, offline-capable for reporting in the field
- **Native**: React Native or Expo wrapper if camera and background location become first-class needs

---

*This document captures the production target so the demo prototype's intentional shortcuts are clearly bounded. Don't ship the demo — ship some thoughtful subset of this list.*
