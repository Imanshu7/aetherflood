# AetherFlood Copilot — Emergency Satellite & Infrastructure SITREP Engine (Prototype)

## Run

Frontend:

1. `cd frontend`
2. Install npm if needed, then `npm install`
3. `npm run dev` and open the printed localhost URL

Backend:

1. `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload`

Or run both at once:

- `python run.py` (also `run.bat` on Windows)

> If sections render blank or throw `... is not defined` after pulling new code,
> restart the Vite dev server: a file saved mid-edit can leave a stale transform
> in the dev cache. Production builds (`npm run build`) always compile from disk.

## Views

- **Dashboard** — explicitly labelled illustrative prototype vectors (seeded
  polygons/counts). The upstream-preset ▲ button now runs a REAL public-DEM
  downstream trace (`/api/bonus/trace-flood-path`). Map scroll-zoom is off until
  you click the map; scrolling over the map pans the page.
- **Compare** — public Copernicus EMS activation catalogue (Nepal filter, cached
  10 min server-side, 30 s client timeout with local fallback), EMS
  area-of-interest map, product metadata, and four verified same-viewport
  Sentinel-2 L1C before/after pairs (12 Aug 2026 BEFORE; 27 Aug / 21 Sep 2026
  AFTER) with a manual slider. An unverifiable wide-area framing was removed.
- **Overview** — source-linked reports for two strictly separated incidents plus
  an automatic (3 s, ~500 ms crossfade, play/pause, reduced-motion aware)
  before/after viewer for the verified Betrawati/Gerkhu pair.
- **Incidents** — source-attributed registry partitioned by incident, with map
  focus navigation using stored coordinates.
- **Copilot** — grounded EN/NE situation-report copilot. Without validated data
  it reports unavailable rather than inventing numbers. Nepali output is
  produced server-side via **Sarvam AI** (`POST https://api.sarvam.ai/v1/chat/completions`,
  model `sarvam-105b`, `api-subscription-key` auth — all per official Sarvam
  docs, verified live): the grounded English report is translated with
  fact-preservation rules (untranslated-English echoes are rejected as errors,
  never cached or displayed as Nepali), failures surface as explicit errors
  with retry (never silent English, never another provider). Overview,
  Incidents, Copilot, and satellite-comparison UI strings translate through
  the same backend (`POST /api/translate`, successes cached, failures never
  cached). Key: backend-only `SARVAM_API_KEY` env var or root `.env` (see
  `.env.example`; never in frontend code or logs).

## What is NOT implemented

Arbitrary-area flood *classification* (no SAR/optical raster pipeline: scene
download needs CDSE credentials + processing stack), confirmed damage
estimation, real-time monitoring, and flood-driven road-closure modeling.
Endpoints and UI report these as explicit unavailable/blocked states. The
backend retains a real operational pipeline (public CDSE catalogue search,
pre-event OSM extraction, public-DEM tracing, background jobs API) with no
user-facing section; it remains reachable via the documented API.

## Dataset compliance (Track B)

Permitted operational inputs (actually connected): Sentinel-1/2 **catalogue
search** (CDSE OData, public, no credentials), **pre-event OSM** via ohsome
API (snapshot ≤ 2026-07-27T00:00:00Z; full-history geometries valid at the
snapshot), **public elevation tiles** (AWS Terrarium; NOT Copernicus
WorldDEM-30 — results labelled terrain-derived potential paths, never
hydraulic simulation).

Restricted validation-only references (never operational inputs): Copernicus
EMS activation **EMSR927**, UNOSAT products, published damage maps, post-event
OSM edits. No dataset named “DMS” exists; EMSR927 is never an operational input.

## Incident separation

- **Incident A (historical):** Nepal–Tibet flood, 26 Aug 2026, Rasuwa / Bhote
  Koshi–Trishuli corridor. Compare + Analysis preset. EMSR927 validation only.
- **Incident B (developing):** Budhi Gandaki flash flood, 11 Oct 2026, Gorkha
  District. Overview + Analysis preset, from dated ICIMOD / Kathmandu Post
  reports. August imagery is never shown as its evidence.

## Attribution

- “Contains modified Copernicus Sentinel data 2026.”
- “Produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus
  Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European
  Union and ESA; all rights reserved.” (only where WorldDEM-30 is used)
- “© OpenStreetMap contributors.” — “European Union, Copernicus Emergency
  Management Service data.” (validation references only)
- Training references: Sen1Floods11 (Bonafilia et al., CVPR Workshops 2020,
  CC BY 4.0) · Kuro Siwo flood training data (Bountos et al., NeurIPS 2024,
  MIT License).

## Tests

- Backend: `python backend/test_api.py` — 9 checks incl. real DEM trace.
- Backend: `python backend/test_analysis.py` — 7 checks (validators, pairing,
  D8, road math, copilot grounding, job API states). All offline, no network.
- Backend: `python backend/test_sarvam.py` — 6 checks (key/validation errors,
  fact-pinned prompts, auth/rate-limit/empty/timeout handling, engine + sitrep
  wiring). All offline with stubbed transport; live Sarvam translation was
  additionally verified end-to-end with a real key (NE chat + full NE SITREP,
  Devanagari fluency and number/date/source preservation confirmed).
- Frontend: `npm run build`, `npm run lint`, plus `frontend/smoke/` regression
  scripts (SSR render per view; headless-Chrome section/scroll/comparison
  tests — needs system Chrome).

## Deployment

The backend is a FastAPI app and the frontend is a Vite SPA. They deploy
separately: the API to a Hugging Face Space (Docker), the UI to Firebase
Hosting.

### Backend — Hugging Face Spaces

`backend/Dockerfile` is a Spaces-compatible Dockerfile. It starts the existing
ASGI app from its real import path and binds the port Spaces expects.

- Build command (run from the repository root):
  `docker build -f backend/Dockerfile -t aetherflood-api .`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port 7860`
- Health endpoint: `GET /api/health`
- Dependencies: `backend/requirements.txt` (fastapi, uvicorn, pydantic,
  requests, httpx, numpy, scipy, networkx, Pillow). Verified with a clean
  `pip install` on Python 3.12 and by booting the API in an isolated virtualenv
  with no PyTorch installed.

Required Space **secrets** (Settings -> Variables and secrets):

| Variable | Purpose |
|---|---|
| `SARVAM_API_KEY` | Nepali translation provider. Backend-only. |
| `AETHERFLOOD_ALLOWED_ORIGINS` | Comma-separated allowed browser origins (add your Firebase origin). |

Optional: `SARVAM_MODEL`, `SARVAM_API_URL`, `COPILOT_LLM_MAX_SECONDS`.

Database: the SQLite file ships at `backend/data/aetherflood.db` and is copied
into the image, so the Space boots with the existing incident records intact.

Startup behaviour was verified rather than assumed. `DatabaseService.__init__`
runs `CREATE TABLE IF NOT EXISTS` and seeds **only when `SELECT COUNT(*)` is 0**
(`backend/services/db.py:122`). A triage status update was written, the process
was restarted, and the record survived unchanged, so startup does not wipe
data. The `DROP TABLE` branches run only as a legacy-schema migration.

**Spaces container filesystems are ephemeral.** The database is restored from
the image on every rebuild or restart, so **triage status changes made through
the UI are lost when the Space restarts**, even though they survive an ordinary
process restart on a normal disk. Do not treat an in-Space triage edit as
permanently saved.

Smallest compatible fix if durable writes are required: point `DB_PATH` at a
mounted persistent volume. No schema change or migration is needed - the file
format and code path are unchanged. As shipped the app does not claim a
durability it does not have.

AI limitations on a Space:

- **Ollama is not included.** CPU-only Spaces cannot run the local models
  (measured locally: >70 s for a short answer), so the Copilot uses its
  deterministic evidence composer. `COPILOT_LLM_MAX_SECONDS` bounds any local
  model attempt and disables it automatically when too slow.
- No GPU is assumed anywhere.
- The satellite assets under `frontend/public` are served by Firebase, not the
  API container.

### Frontend — Firebase Hosting

`firebase.json` serves `dist` with an SPA rewrite to `/index.html`.

- `VITE_API_BASE_URL` selects the backend. It is read at build time by
  `frontend/src/config.js`; every API call goes through `apiUrl()`.
- Build for production with the backend URL set, otherwise the local
  development default is compiled in:

```
cd frontend
VITE_API_BASE_URL=https://<your-space>.hf.space npm run build
```

- Deploy: `firebase deploy --only hosting` (run from the repository root).
- `.firebaserc` is intentionally **not** committed — add your own project alias
  before deploying.

Never put `SARVAM_API_KEY` or any secret in a `VITE_*` variable: Vite inlines
every `VITE_*` value into the browser bundle.

### Environment variables

| Variable | Where | Notes |
|---|---|---|
| `SARVAM_API_KEY` | backend env / Space secret | Never in the frontend. |
| `SARVAM_MODEL` | backend env | Defaults to `sarvam-105b`. |
| `AETHERFLOOD_ALLOWED_ORIGINS` | backend env | Explicit origin allow-list for CORS. |
| `VITE_API_BASE_URL` | build-time frontend | Public backend URL. |
| `OLLAMA_HOST`, `OLLAMA_MODEL`, `COPILOT_LLM_MAX_SECONDS` | backend env | Optional local LLM path. |

## Manual deployment checklist (not yet performed)

No Docker daemon and no Firebase CLI are available in this environment, and no
cloud credentials are configured. The application has **not** been deployed.
The following steps remain for the project owner.

### Hugging Face Spaces

1. Create a new Space, SDK: **Docker**, hardware CPU basic.
2. Push the repository to a Git repo and connect it to the Space (branch and
   repo path). The build context must be the repository root.
3. Settings -> Variables and secrets -> add **Secrets**:
   SARVAM_API_KEY (required for Nepali translation).
4. Add **Variables**: AETHERFLOOD_ALLOWED_ORIGINS set to your Firebase
   Hosting origins, comma separated.
5. Leave the Docker SDK build arguments empty; the image's own
   CMD already starts the server on  .0.0.0:7860.
6. Watch the build log for Uvicorn running on http://0.0.0.0:7860.
7. Verify: GET https://<space>.hf.space/api/health returns
   {"status":"ok", ...}, then GET /api/incidents returns 8 records and
   POST /api/copilot/chat returns a grounded reply.

### Firebase Hosting

1. 
pm i -g firebase-tools and irebase login.
2. irebase use --add and pick the real project (no project id is committed
   here on purpose).
3. Build with the Space URL:
   cd frontend && VITE_API_BASE_URL=https://<space>.hf.space npm run build
4. irebase deploy --only hosting.
5. Verify the live site loads, the nav works, Map View shows both alternating
   pairs, Copilot answers, and the Network tab shows requests going to
   https://<space>.hf.space with no CORS errors.
