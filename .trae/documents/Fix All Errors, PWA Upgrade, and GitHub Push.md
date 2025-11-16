## Scope and Objectives
- Fix all runtime, build, and logic errors across backend and frontend
- Complete PWA implementation with offline-first behavior
- Push the working project to your GitHub account (private or public per your preference)

## Repository Survey Highlights
- Backend routes located under `api/routes/*.ts` (e.g., CRM, journal, financial, reports)
- Supabase client config throws when envs missing: `api/config/supabase.ts:18-27`
- Frontend API wrapper attaches `user-id` header: `src/lib/api.ts:55-63`
- Journal endpoints require `user-id` header: `api/routes/journal.ts:17-24,140-149`
- PWA plugin already included: `vite.config.ts:26-121` and manifest present: `public/manifest.json:1-53`

## Phase 1: Error Audit and Repro
- Run full build for both frontend and backend
- Start dev servers and navigate critical flows: CRM clients, journal, financial dashboards, reports
- Capture console, network, and server logs; identify failing endpoints and DB errors
- Catalog errors including:
  - Env var validation failures (Supabase): `api/config/supabase.ts:18-27`
  - Foreign key violations (e.g., `clients_user_id_fkey`) in CRM: `api/routes/crm.ts:328-341`
  - Journal auth 401 due to missing `user-id`: `api/routes/journal.ts:17-24`
  - Function type mismatches and JSON coercion issues (migrations folder)
  - Proxy/port mismatches in dev: `vite.config.ts:128-145`

## Phase 2: Backend Fixes
- Supabase env robustness: allow running when anon/service keys present, fail gracefully with actionable messages
- CRM endpoints
  - Align required field names (e.g., `company_name`) with UI
  - Validate `user_id` and provide safe handling/fallback if non-existent
  - Standardize response envelopes `{ success, data, error }`
- Journal endpoints
  - Ensure `user-id` header consistently passed from frontend wrapper
  - Add defensive checks and clear 401/400 messages
- Reports/Financial
  - Remove or correct problematic relationship selects
  - Fix function return type mismatches in Supabase functions
  - Resolve "Cannot coerce result to single JSON object" by returning array or single `.single()` appropriately
- Add rate limiting and CORS hardening using existing middleware

## Phase 3: Database Consistency
- Inspect migrations under `supabase/migrations/*`
- Fix BIGINT/UUID mismatches in functions and views
- Validate FKs: ensure all `*_user_id_fkey` constraints can be satisfied via seed/demo users
- Add lightweight validation scripts to check integrity (counts, nulls, invalid UUIDs)

## Phase 4: Frontend Fixes
- API base config and proxy alignment: `src/lib/api.ts:1-8`, `vite.config.ts:128-145`
- Ensure all create/update flows send the correct payload shape
- Journal flows: make sure `user-id` header is set via API wrapper
- Error handling
  - Normalize API error parsing `src/lib/api.ts:64-109`
  - User-facing toasts consistent and informative
- Performance warnings: split large chunks via Rollup manualChunks, if necessary

## Phase 5: PWA Completion
- Manifest
  - Validate names, icons, shortcuts (`public/manifest.json:1-53`)
- Service worker
  - Ensure Workbox caching strategies for:
    - App shell: `NetworkFirst` fallback
    - Static assets: `StaleWhileRevalidate`/`CacheFirst`
    - Images: `CacheFirst`
    - API: `NetworkFirst` with timeout and offline cache for key endpoints
- Offline UX
  - Graceful offline banners and retry
  - Background sync for creating clients/journal entries when offline (queue then flush)
- Install prompt flow (component exists): `src/components/pwa/PWAInstallPrompt.tsx`
- Validation
  - Lighthouse PWA audit
  - Manual install on desktop/mobile

## Phase 6: Verification
- Full end-to-end pass:
  - Create/update/delete client
  - Journal add/edit/delete and stats
  - Financial/report endpoints
- Automated checks
  - Lint, typecheck, build
  - Simple API integration tests (non-sensitive)

## Phase 7: GitHub Push
- Create or use a repository under your GitHub account
- Steps:
  - Initialize remote: `git remote add origin https://github.com/<your-username>/<repo>.git`
  - Ensure `.env*` are excluded (`.gitignore` present)
  - Commit all changes with conventional messages
  - Push main branch: `git push -u origin main`
- If you prefer private repo, set repository visibility accordingly

## Deliverables
- Error-free build and runtime across main flows
- Completed PWA with offline caching and installability
- Repository pushed to your GitHub account
- Short deployment notes (optional) for Vercel or preferred hosting

## Inputs Needed
- Your GitHub username and desired repository name
- Repository visibility (public/private)
- Confirmation to proceed with fallback handling for non-existent `user_id` by mapping to demo or first available user, as previously implemented

## Execution Plan
- Implement fixes incrementally, verifying after each phase
- Maintain security: never commit secrets
- Provide concise change summaries, with code references for key fixes
- After completion, push to your GitHub and share the repo URL