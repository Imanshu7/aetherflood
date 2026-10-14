# AetherFlood Copilot

> **Emergency Satellite & Infrastructure SITREP Engine for Himalayan Floods & Landslides**  
> *“Satellites can see the valleys where ground sensors were swept away.”*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9+-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Sarvam AI](https://img.shields.io/badge/Sarvam%20AI-sarvam--105b-orange)](https://www.sarvam.ai/)
[![Tests](https://img.shields.io/badge/Tests-29%2F29%20Passing-brightgreen)](#testing--verification)

---

## Table of Contents
1. [Overview & Challenge Alignment](#overview--challenge-alignment)
2. [Answering the Three Critical Rescue Questions](#answering-the-three-critical-rescue-questions)
3. [AI Component: Grounded Situation-Report Copilot](#ai-component-grounded-situation-report-copilot)
4. [AI Component: Siamese Bi-Temporal Change Detection](#ai-component-siamese-bi-temporal-change-detection)
5. [Bonus Feature: DEM Downstream Valley Flow Tracing](#bonus-feature-dem-downstream-valley-flow-tracing)
6. [System Outputs: Map Dashboard & 1-Page SITREP](#system-outputs-map-dashboard--1-page-sitrep)
7. [System Limitations](#system-limitations)
8. [Quick Start & How to Run](#quick-start--how-to-run)
9. [System Architecture & Data Flow](#system-architecture--data-flow)
10. [Strict Incident Separation & Data Compliance](#strict-incident-separation--data-compliance)
11. [API Reference](#api-reference)
12. [Testing & Verification](#testing--verification)
13. [3-Member Team Division & Responsibilities](#3-member-team-division--responsibilities)
14. [Deployment & Hosting Guide](#deployment--hosting-guide)
15. [Built With & AI Assistance Disclosure](#built-with--ai-assistance-disclosure)
16. [Attributions & Licensing](#attributions--licensing)

---

## Overview & Challenge Alignment

During catastrophic Himalayan flash floods and glacial lake outburst floods (GLOFs), physical hydrological telemetry and river gauge stations are frequently pulverized in the opening minutes of the surge. 

**AetherFlood Copilot** is an open-source emergency satellite intelligence and situation report platform engineered specifically for rapid disaster response in mountainous terrain (such as the Trishuli–Bhote Koshi corridor and Budhi Gandaki basin of Nepal). Taking an **area of interest (AOI)** and a **flood event date**, it combines **Copernicus Sentinel radar and optical satellite data**, **OpenStreetMap (OSM) infrastructure vectors**, **public digital elevation models (DEM)**, and **grounded bilingual language models** to empower crisis command centers and rescue teams.

> For our complete project narrative, mathematical derivations, and challenge journey, see [STORY.md](STORY.md).

---

## Answering the Three Critical Rescue Questions

The system is architected from the ground up to answer the three fundamental operational questions faced by disaster coordinators:

```
                              ┌──────────────────────────────────────────────┐
                              │            AETHERFLOOD PIPELINE              │
                              └──────────────────────┬───────────────────────┘
                                                     │
         ┌───────────────────────────────────────────┼──────────────────────────────────────────┐
         │                                           │                                          │
         ▼                                           ▼                                          ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐   ┌───────────────────────────────┐
│ 1. WHERE DID THE FLOOD HIT?   │   │ 2. WHAT WAS DAMAGED?          │   │ 3. WHO IS CUT OFF?            │
├───────────────────────────────┤   ├───────────────────────────────┤   ├───────────────────────────────┤
│ • Sentinel-1 SAR (C-band radar│   │ • Pre-event OSM via ohsome    │   │ • NetworkX topological road   │
│   sees through monsoon clouds)│   │   (strict cutoff snapshot)    │   │   graph with snapped nodes    │
│ • Sentinel-2 MSI (cloud-free  │   │ • Spatial intersection of     │   │ • Dijkstra shortest paths     │
│   optical multispectral)      │   │   flood extents with building │   │   from settlements to nearest │
│ • Strict Same-Orbit Track 121 │   │   footprints, bridges, and    │   │   hospital / hub town         │
│   filter (no false anomalies) │   │   primary highway corridors   │   │ • Identifies completely       │
│ • Copernicus DEM slope filter │   │ • Classification of exposed   │   │   isolated communities        │
│   (eliminates radar shadows)  │   │   vs destroyed infrastructure │   │   requiring heli-drops        │
└───────────────────────────────┘   └───────────────────────────────┘   └───────────────────────────────┘
```

### 1. Where did the flood hit?
* **Dual-Sensor Earth Observation**:
  * **Sentinel-1 C-SAR (Synthetic Aperture Radar)**: Penetrates dense Himalayan monsoon cloud covers, rain storms, and night-time darkness. Detects specular surface water via backscatter drop ($\sigma^0$ attenuation in VV/VH polarisation).
  * **Sentinel-2 MSI (Multispectral Optical)**: Activated during clear-sky windows for high-resolution 10 m true-color inspection, NDWI (Normalized Difference Water Index), and visual confirmation of debris fans and silt deposition.
* **Strict Same-Orbit Physical Geometry Rule**:
  * Comparing an ascending pass against a descending pass in steep mountain terrain creates catastrophic geometric layover and foreshortening false positives ($>10\text{ dB}$ false backscatter delta).
  * AetherFlood strictly enforces **identical relative orbit tracks** (e.g., Track 121) and identical look angles. Pairs with divergent geometry are automatically rejected at the API validator level (`backend/ml/change_detection_pipeline.py`).
* **Physics-Guided DEM Slope Mask**:
  * Standing water does not adhere to 45° mountain slopes. Terrain with slope $>18^\circ$ is masked out using Copernicus DEM slope models to eliminate radar-shadow false alarms.

### 2. What was damaged?
* **Pre-Event OpenStreetMap Infrastructure Extraction**:
  * Queries full-history OSM infrastructure via the **ohsome API** using a strict pre-event snapshot timestamp (e.g., $\le \text{2026-07-27T00:00:00Z}$) to guarantee that post-event edits or synthetic test geometries never contaminate baseline counts.
* **Asset Exposure & Damage Assessment**:
  * **Buildings**: Calculates intersection of flood/debris polygons with pre-event building footprints.
  * **Bridges**: Pinpoints severed river crossings, washed-out Bailey bridges, and suspension footbridges.
  * **Roads**: Measures centerline kilometers of submerged or collapsed highways (e.g., Pasang Lhamu Highway / Trishuli corridor).

### 3. Who is cut off?
* **Topological Network Routing**:
  * Builds an endpoint-snapped graph ($G = (V, E)$) using pre-event OSM road networks via **NetworkX**. Edge weights represent Haversine ground distances.
  * Links every populated settlement node to critical lifeline facilities: district hospitals, emergency medical centers, and main administrative hubs.
* **Isolation & Severance Detection**:
  * Executes Dijkstra shortest-path queries on the passable road graph.
  * Flags settlements where paths are broken or where traversed road segments intersect flood/debris zones as **ISOLATED / CUT OFF**, allowing search-and-rescue teams to immediately prioritize helicopter airlift routes and emergency food drops.

---

## AI Component: Grounded Situation-Report Copilot

Rather than allowing a generic large language model to hallucinate casualty numbers, coordinates, or infrastructure losses, AetherFlood implements a **Zero-Hallucination, Fact-Pinned Disaster Copilot** (`backend/services/copilot_engine.py`):

1. **Strict Zero-Hallucination Grounding**:
   * Every statistic, road count, bridge name, date, and coordinate must be present in structured verified incident data or system maps.
   * If an operator asks for a metric not verified by Earth observation or ground reports, the engine explicitly outputs a **transparent data gap / unavailable notice** instead of guessing.
2. **Dual-Language Rescue Fluency (English & Nepali / नेपाली)**:
   * **English**: Formatted according to UN OCHA (Office for the Coordination of Humanitarian Affairs) and Incident Command System (ICS) disaster standards.
   * **Nepali**: Formatted according to NDRRMA (*राष्ट्रिय विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन प्राधिकरण*) official crisis terminology.
3. **Sarvam AI Engine Integration**:
   * Uses **Sarvam AI** (`sarvam-105b` model via `https://api.sarvam.ai/v1/chat/completions`) with Devanagari script preservation and fact-pinned prompts.
   * Enforces a whole-document Devanagari fluency floor and Markdown structure preservation (`backend/services/sarvam_translate.py`). Untranslated English echoes are rejected, and translation failures fall back cleanly without losing grounded English data.
4. **Local Offline Inference Support**:
   * Supports local Ollama deployment (`llama3.2`, `gemma2:2b`) with automatic CPU latency timeouts (`COPILOT_LLM_MAX_SECONDS`), automatically falling back to deterministic evidence composition if compute resources are constrained.

---

## AI Component: Siamese Bi-Temporal Change Detection

Located at `backend/ml/change_detection_pipeline.py`, the system implements a modern Siamese neural architecture for automated SAR change detection:

* **Dual-Branch Siamese-UNet / ChangeFormer Hybrid**: Takes co-registered pre-event ($T_{\text{pre}}$) and post-event ($T_{\text{post}}$) Sentinel-1 GRD SAR scenes.
* **Calibrated Feature Interaction**: Calibrates SAR backscatter ($\text{linear} \leftrightarrow \text{dB}$), applies Refined Lee speckle filtering, and computes bi-temporal differential representations (difference, ratio, attention magnitude).
* **Multi-Class Segmentation**: Classifies pixels into:
  * `Class 0`: Unchanged Terrain
  * `Class 1`: Newly Inundated Flood Water
  * `Class 2`: Landslide Debris / Silt Mudflow Deposit
* **Training Benchmarks Supported**: Sen1Floods11 (Bonafilia et al.) and Kuro Siwo multi-modal flood training datasets.

---

## Bonus Feature: DEM Downstream Valley Flow Tracing

Given any user-selected upstream coordinate (e.g., glacial lake outlet, moraine breach, or cloudburst epicenter), AetherFlood traces the natural drainage and flood surge down the Himalayan valley using real digital elevation data (`backend/services/dem_trace.py`):

* **Algorithm**: D8 steepest-descent flow direction routing.
* **Elevation Data Source**: Public AWS Terrain Tiles (`elevation-tiles-prod` Terrarium RGB encoding; SRTM / ETOPO-class data, keyless access).
* **Metrics Computed**:
  * Total downstream channel distance (km).
  * Total elevation drop (meters) from origin to valley terminus.
  * Valley gradient percentage ($\frac{\Delta h}{L}$).
  * Downstream settlement vulnerability ranking: matches the predicted flow path coordinates against OSM settlement points to list villages in the downstream impact corridor.
* **Transparency**: Explicitly labelled as a *terrain-derived potential flow path*, strictly distinguishing it from a 2D/3D hydrodynamic hydraulic simulation.

---

## System Outputs: Map Dashboard & 1-Page SITREP

### 1. Interactive Map Dashboard (`frontend/src/components/DashboardView.jsx`)
* **Leaflet High-Performance Map**: Multiple basemaps (CartoDB Positron, OSM Standard, Esri World Imagery Satellite).
* **Layer Toggles**:
  * Inundation extent & flood boundary vectors.
  * Debris accumulation zones.
  * Pre-flood river thalweg.
  * Pre-event OSM road network (color-coded by passable vs. severed status).
  * Critical bridges (intact vs. destroyed markers).
  * Hospital and emergency care locations.
  * Settlement isolation markers (accessible vs. cut off).
  * Interactive Upstream Point Picker for instant DEM trace visualization.
* **Side-by-Side Satellite Comparison Swipe View**: Interactive split-screen slider comparing co-registered Sentinel-2 true-color captures before and after flood events.

### 2. Standard 1-Page Situation Report (SITREP)
* **Bilingual Generation**: Available in English and Nepali at the click of a button (`GET /api/copilot/sitrep`).
* **Sections Included**:
  * Executive Overview & Incident Header (Location, Coordinates, Date/Time).
  * Hydrological & Remote Sensing Observations (Sensor passes, orbit track, cloud cover).
  * Infrastructure Exposure Summary (Buildings hit, bridges collapsed, road km severed).
  * Cut-Off Communities & Urgent Rescue Recommendations.
  * Data Provenance & Sensor Limitations Disclosure.
* **Exportable**: Clean Markdown format, exportable directly to PDF or dispatch telegram.

---

## System Limitations

Disaster rescue systems must be ruthlessly honest about their physical, technical, and operational boundaries. AetherFlood explicitly documents what the system **cannot** do:

1. **Satellite Revisit Latency & No Real-Time Pre-Warning**:
   * Sentinel-1 and Sentinel-2 constellations have repeat orbital cycles of **6 to 12 days**.
   * Consequently, satellites **cannot** provide real-time advance warnings for sudden glacial lake outburst floods (GLOFs), cloudburst flash floods, or catastrophic glacier collapses minutes ahead. They are post-event mapping and assessment instruments, not early warning sirens.
2. **Himalayan Mountain Layover & Shadowing**:
   * Side-looking SAR sensors suffer from geometric distortion (foreshortening, layover, and shadowing) on steep mountain faces.
   * If pre- and post-disaster images are captured from different relative orbit tracks (e.g. Ascending vs. Descending), false-positive backscatter anomalies exceed $10\text{ dB}$. The system enforces identical track pairing to mitigate this, but north/south valley orientations remain partially obscured.
3. **Monsoon Cloud Cover Constraints on Optical Imagery**:
   * Sentinel-2 multispectral optical imagery is unusable when obscured by dense monsoon cloud decks (cloud cover $>20\%$). In active storms, radar (Sentinel-1) is the sole viable sensor.
4. **Turbulent Whitewater vs. Calm Water Backscatter**:
   * Calm flood water reflects radar pulses specularly away, appearing as a dark zero-signal patch.
   * Fast-moving, turbulent, boulder-choked mountain flash floods create rough surface backscatter that can resemble land, potentially underestimating water area without calibrated bi-temporal thresholding.
5. **Topological Road Routing vs. In-Situ Physical Blockages**:
   * Road network severance is calculated via topological intersection with satellite-mapped flood polygons and D8 paths.
   * Satellite imagery cannot detect localized minor rockfalls, culvert washouts, or single fallen trees under forest canopies that may render a road impassable to vehicles.
6. **Terrain Potential Path vs. Full Hydrodynamic Simulation**:
   * The D8 downstream elevation trace models steepest topographic descent; it does **not** solve Saint-Venant 2D shallow water equations, does not model momentum or hydraulic jumps, and does not calculate sediment transport or Manning's roughness.
7. **Stateless Container Storage**:
   * In containerized environments (such as Vercel or ephemeral Docker instances), database writes (such as incident triage status updates) reside in SQLite and will reset upon container reboot unless bound to a persistent volume.

---

## Quick Start & How to Run

### Prerequisites
* **Python**: 3.10, 3.11, or 3.12
* **Node.js**: v18+ and **npm**
* *(Optional)*: **Sarvam AI API Key** for live Nepali translation (`SARVAM_API_KEY`). If omitted, the system operates in English and uses structured Nepali reference templates.

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/aetherflood.git
cd aetherflood
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Edit `.env` (optional for local dev):
```ini
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_MODEL=sarvam-105b
AETHERFLOOD_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

### 3. Run Everything in One Command (Recommended)

AetherFlood includes an intelligent unified launcher (`run.py` / `run.bat`) that automatically frees occupied ports (8000 & 5173), spawns the FastAPI backend and Vite frontend concurrently, and handles graceful shutdown:

```bash
# On Linux / macOS / Windows PowerShell:
python run.py

# Or on Windows Command Prompt:
run.bat
```

Once running, access:
* **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
* **Backend API & Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Backend Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 4. Running Services Individually

#### Backend (FastAPI)
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start backend on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend (React + Vite)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

---

## System Architecture & Data Flow

```
                                      USER BROWSER / RESCUE OFFICER
                                 ┌──────────────────────────────────────┐
                                 │ React 18 SPA (Vite + Tailwind + Leaflet)│
                                 │ - Dashboard & Interactive Maps       │
                                 │ - Bilingual Copilot Q&A (EN/NE)      │
                                 │ - 1-Page SITREP Exporter             │
                                 │ - Satellite Before/After Slider      │
                                 └──────────────────┬───────────────────┘
                                                    │ REST API
                                                    ▼
                                     FASTAPI ASYNC BACKEND (Port 8000)
       ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
       │                                            │                                            │
       ▼                                            ▼                                            ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐   ┌───────────────────────────────┐
│ GEOSPATIAL & TERRAIN ENGINE   │   │ GROUNDED COPILOT ENGINE       │   │ ML CHANGE DETECTION PIPELINE  │
├───────────────────────────────┤   ├───────────────────────────────┤   ├───────────────────────────────┤
│ • D8 Elevation Downstream     │   │ • Fact-Pinned Retriever       │   │ • Sentinel-1 Orbit Validator  │
│   Tracer (AWS Terrarium tiles)│   │ • Zero-Hallucination Formatter│   │ • Siamese-UNet / ChangeFormer │
│ • Pre-event OSM ohsome parser │   │ • Sarvam AI Translator        │   │ • Physics Slope Masking (DEM) │
│ • NetworkX Road Routing Graph │   │   (Devanagari model: 105b)    │   │ • Sen1Floods11 / Kuro Siwo    │
│ • CDSE OData Catalogue Search │   │ • Local Ollama fallback path  │   │   dataset compatibility       │
└───────────────────────────────┘   └───────────────────────────────┘   └───────────────────────────────┘
```

---

## Strict Incident Separation & Data Compliance

To maintain forensic scientific integrity, the system strictly separates historical validation cases from developing events:

| Incident Identifier | Event Name | Primary Geography | Event Date | Data Sources & Status |
|---|---|---|---|---|
| **Incident A** (`nepal-tibet-2026-08-26`) | Nepal–Tibet Border Flood | Rasuwa / Bhote Koshi–Trishuli Corridor | 26 Aug 2026 | Historical reference event. Verified Sentinel-2 L1C before/after pairs (12 Aug vs 27 Aug). Copernicus EMS **EMSR927** referenced *strictly for post-hoc validation*. |
| **Incident B** (`budhi-gandaki-2026-10-11`) | Budhi Gandaki Flash Flood | Gorkha District, Chumchet / Sirdibas | 11 Oct 2026 | Developing event. Sourced from verified ICIMOD and national disaster agency field telemetry. August satellite scenes are strictly blocked from being misattributed to this event. |

### Track Compliance Rules:
1. **Pre-Event OSM Cutoff**: OSM geometry extractions strictly enforce a cutoff date $\le \text{2026-07-27T00:00:00Z}$. Post-disaster edits are rejected.
2. **No Post-Hoc Data Leakage**: Copernicus EMS activation EMSR927 and UNOSAT maps are never used as training or operational inputs; they serve only as validation references.
3. **Transparent Data Gaps**: The backend refuses to fabricate synthetic geometries or casualty metrics when real verified scenes are not ingested.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and engine status verification. |
| `GET` | `/api/incidents` | List source-attributed incident records (partitioned by ID). |
| `GET` | `/api/incidents/canonical` | Retrieve canonical verified records for all incidents. |
| `POST` | `/api/incidents/{id}/status` | Update incident triage status (`REPORTED`, `CONFIRMED`, `MONITORED`, `RESOLVED`). |
| `POST` | `/api/copilot/chat` | Query the grounded bilingual rescue assistant with bounded conversation turns. |
| `GET` | `/api/copilot/sitrep` | Generate a 1-page official Situation Report in English (`en`) or Nepali (`ne`). |
| `GET` | `/api/bonus/trace-flood-path` | **Bonus**: Trace downstream D8 path from `lat` & `lon` using public elevation tiles. |
| `POST` | `/api/translate` | Batch translate text strings to Nepali via Sarvam AI with structure preservation. |
| `POST` | `/api/analysis/jobs` | Launch asynchronous analysis job (CDSE search, ohsome OSM extract, DEM trace). |
| `GET` | `/api/analysis/jobs/{id}` | Inspect analysis job progress, step status, and results. |
| `POST` | `/api/ml/change-detection` | Validate Sentinel-1 bi-temporal pair metadata and run Siamese change detection. |
| `GET` | `/api/copernicus/ems/activations` | Search Copernicus EMS activations with server-side caching. |

---

## Testing & Verification

The repository contains an exhaustive offline and integration test suite (29 tests across 4 suites) with **100% pass rate**:

### 1. Analysis & Geospatial Tests
Verifies bounding box validation, OSM cutoff compliance, same-orbit track pairing rejection, D8 terrain descent, road length math, and copilot grounding:
```bash
python backend/test_analysis.py
```
*Output: `================ ALL 7 ANALYSIS TESTS PASSED! ===============`*

### 2. Bilingual Sarvam AI Integration Tests
Verifies missing key safety, fact-pinned prompt construction, rate-limit/auth handling, Devanagari translation coverage guards, and SITREP structure preservation:
```bash
python backend/test_sarvam.py
```
*Output: `================ ALL 6 SARVAM TESTS PASSED! ===============`*

### 3. API & End-to-End System Tests
Verifies health check, metrics transparency, DEM downstream flow tracing over AWS tiles, Copilot chat grounding, orbit track error codes (400), and Siamese ML validation:
```bash
python backend/test_api.py
```
*Output: `================ ALL 9 BACKEND API TESTS PASSED! ===============`*

### 4. Translation Coverage Guard Tests
```bash
python backend/test_translation_coverage.py
```
*Output: `================ ALL 7 COVERAGE TESTS PASSED ================`*

### 5. Frontend Production Build Check
```bash
cd frontend && npm run build
```
*Output: ` built in ~1.2s` with zero errors.*

---

## 3-Member Team Division & Responsibilities

To ensure clear ownership, end-to-end execution, and seamless defense during hackathon presentations or code reviews, the project is structured across three core specialization tracks:

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│            MEMBER 1             │   │            MEMBER 2             │   │            MEMBER 3             │
│   Remote Sensing, ML & DEM      │   │   Backend, Copilot & DevOps     │   │   Frontend, UI/UX & Web Host    │
├─────────────────────────────────┤   ├─────────────────────────────────┤   ├─────────────────────────────────┤
│ • Q1: Where did the flood hit?  │   │ • Q2: What was damaged? (OSM)   │   │ • Output 1: Leaflet Dashboard   │
│ • Sentinel-1 SAR & S2 Optical   │   │ • Q3: Who is cut off? (Routing) │   │ • Output 2: 1-Page SITREP UI    │
│ • Orbit Track 121 Physics Guard │   │ • Zero-Hallucination Copilot    │   │ • Satellite Before/After Slider │
│ • Siamese Change Network (PyTorch)│ │ • Sarvam AI Bilingual Engine    │   │ • Bilingual Localization (EN/NE)│
│ • Bonus: DEM Downstream Tracer  │   │ • Background Jobs & SQLite DB   │   │ • Leaflet Layer Controllers     │
│ • Cloud Compute Optimization    │   │ • Vercel Backend Hosting        │   │ • Firebase Hosting & CDN Build  │
└─────────────────────────────────┘   └─────────────────────────────────┘   └─────────────────────────────────┘
```

---

### Member 1: Remote Sensing, ML Change Detection & Geospatial Algorithms Lead

* **Primary Challenge Focus**: **Question 1** (*"Where did the flood hit?"*) and **Bonus Challenge** (*"DEM Downstream Flow Path Tracing"*).
* **Key Modules & Files Owned**:
  * `backend/ml/change_detection_pipeline.py`: Dual-branch Siamese neural change detection network (Siamese-UNet / ChangeFormer hybrid) for SAR flood and debris segmentation; speckle filtering; backscatter calibration.
  * `backend/services/cdse_search.py`: Copernicus Data Space Ecosystem (CDSE) OData catalogue search for Sentinel-1 GRD and Sentinel-2 L2A scenes.
  * **Orbit & Geometry Validation**: Implemented strict Sentinel-1 same-orbit constraints (Track 121, ascending/descending alignment) to eliminate $>10\text{ dB}$ mountain layover/shadow false anomalies.
  * `backend/services/dem_trace.py`: D8 steepest-descent elevation flow routing algorithm on public AWS Terrarium DEM tiles, computing downstream distance, elevation drop, valley gradient %, and listing settlements along the surge path.
  * `backend/services/copernicus.py`: Integration with Copernicus EMS catalogue for post-hoc validation (EMSR927).
* **Hosting & Web Deployment Ownership**:
  * **Firebase Hosting Deployment**: Created `firebase.json`, configured Single Page Application (SPA) rewrite rules, caching headers, and automated deployment commands.
  * Optimized production Vite bundle (`npm run build`), chunk splitting, and runtime backend URL injection (`VITE_API_BASE_URL`).
  * Configured container Python geospatial dependencies (`scipy`, `numpy`, `Pillow`, `torch`).
  * Optimized DEM tile caching and bounding-box spatial query memory budgets for low-latency server execution.
* **Viva / Presentation Talking Points**:
  * *"Why single-image thresholding fails in the Himalayas (radar shadows, wet snow, layover), why Track 121 same-orbit pairing is physically mandatory, and how the D8 flow routing traces potential flood descent down complex river thalwegs."*

---

### Member 2: Backend Architecture, Zero-Hallucination Copilot, Graph Routing & Cloud DevOps Lead

* **Primary Challenge Focus**: **Question 2** (*"What was damaged?"*), **Question 3** (*"Who is cut off?"*), and **AI Component** (*"Situation-report copilot"*).
* **Key Modules & Files Owned**:
  * `backend/main.py` & `backend/services/jobs.py`: Asynchronous FastAPI REST API, background worker threads for long-running analyses, and SQLite database audit logging (`backend/services/db.py`).
  * `backend/services/ohsome_extract.py`: Pre-event OpenStreetMap extraction using the ohsome API with strict snapshot cutoff ($\le\text{2026-07-27}$) to prevent post-disaster data leakage.
  * **Road Network Graph & Isolation Engine** (`backend/services/jobs.py`): Topological graph construction via NetworkX, Haversine edge weighting, Dijkstra shortest-path calculations from settlements to district hospitals, and isolation detection.
  * `backend/services/copilot_engine.py`: Zero-hallucination fact-pinned copilot architecture guaranteeing that every casualty, road, bridge, and coordinate metric comes from verified maps rather than LLM invention.
  * `backend/services/sarvam_translate.py`: Sarvam AI (`sarvam-105b`) integration, fact-pinned translation prompt engineering, Devanagari coverage floor verification, and bilingual 1-page SITREP generation (`/api/copilot/sitrep`).
* **Hosting & Cloud DevOps Ownership**:
  * **Vercel Backend Deployment**: Configured Vercel serverless deployment (`vercel.json`, `backend/vercel.json`, `backend/index.py`), secret management (`SARVAM_API_KEY`), and CORS allow-lists (`AETHERFLOOD_ALLOWED_ORIGINS`).
  * Engineered single-command cross-platform runner (`run.py`, `run.bat`) with automatic stale port clearing (`8000`, `5173`).
* **Viva / Presentation Talking Points**:
  * *"How the Copilot strictly guarantees zero hallucination by retrieving verified incident records before LLM generation, how NetworkX calculates road graph isolation, and how the backend is deployed as serverless functions on Vercel."*

---

### Member 3: Frontend Geospatial UI, Interactive Map Dashboard

* **Primary Challenge Focus**: **System Outputs** (*"Map dashboard plus a one-page situation report"*), Satellite Visualizations, and Production Web Hosting.
* **Key Modules & Files Owned**:
  * `frontend/src/components/DashboardView.jsx`: Full Leaflet geospatial dashboard with multiple basemaps (CartoDB, OSM, Esri Satellite), multi-layer toggles (flood inundation, debris fans, river thalweg, damaged buildings, severed bridges, hospitals, isolated settlements), and click-to-trace upstream DEM flow triggers.
  * `frontend/src/components/CopilotView.jsx`: Bilingual (EN/NE) decision copilot chat interface with progressive streaming animation, conversation turn history, and one-click 1-page SITREP modal with exportable markdown.
  * `frontend/src/components/CopernicusEMSCompareView.jsx` & `frontend/src/components/Sentinel2BeforeAfterSection.jsx`: Side-by-side interactive swipe slider comparing co-registered Sentinel-2 true-color captures before and after the flood, plus Copernicus EMS catalogue viewer.
  * `frontend/src/data/translations.js`: Comprehensive English & Nepali translation dictionary supporting on-the-fly UI localization across all views.
  * Custom Apple iOS HIG circular map marker system (`createIcon`) with high-contrast accessibility badges.
* **Viva / Presentation Talking Points**:
  * *"How the map layers interact to give rescue coordinators an immediate operational picture, how the satellite swipe tool proves before-and-after flood impact, and how the SPA is optimized and hosted globally on Firebase CDN."*

---

## Deployment & Hosting Guide

AetherFlood is designed for decoupled, scalable production deployment:
* **API Backend**: Hosted on **Vercel** (Serverless Python / FastAPI) via `vercel.json` and `backend/index.py`.
* **Frontend SPA**: Hosted globally on **Firebase Hosting** (or Vercel / Cloudflare Pages).

### Backend: Vercel (Serverless Python / FastAPI)

The repository provides native Vercel configuration (`vercel.json` at root and `backend/vercel.json` routing to `backend/index.py`):

1. **Import Repository to Vercel**:
   - Push your code to GitHub.
   - Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** -> **Project**.
   - Select and import the repository.
2. **Configure Settings**:
   - Framework Preset: **Other** (Vercel automatically detects the Python backend and Vite frontend from `vercel.json`).
   - Root Directory: `.`
3. **Set Environment Variables** (Under Project Settings -> Environment Variables):
   - `SARVAM_API_KEY`: Your Sarvam AI key for live Nepali translations.
   - `SARVAM_MODEL`: `sarvam-105b` (optional, default).
   - `AETHERFLOOD_ALLOWED_ORIGINS`: Comma-separated list of allowed origins (e.g. `https://your-frontend.web.app,https://your-project.vercel.app`).
4. **Deploy**:
   - Click **Deploy** (or run `vercel --prod` using the Vercel CLI).
   - Verify deployment: `GET https://<your-project>.vercel.app/api/health` returns `{"status": "ok", "service": "AetherFlood Copilot Engine"}`.

### Frontend: Firebase Hosting

1. Install the Firebase CLI and log in:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Build the frontend pointing to your deployed Vercel backend URL:
   ```bash
   cd frontend
   VITE_API_BASE_URL=https://<your-project>.vercel.app npm run build
   ```
3. Deploy from the repository root:
   ```bash
   firebase deploy --only hosting
   ```

---

## Built With & AI Assistance Disclosure

In accordance with competition rules, all technologies, libraries, APIs, and AI coding assistants utilized in this project are transparently disclosed. The team maintains 100% intellectual ownership and accountability for all submitted code, data models, and architectural decisions, and can explain every algorithm in detail.

### Built With

| Category | Tools & Technologies | Purpose in Project |
|---|---|---|
| **Backend & Web Framework** | **FastAPI**, **Uvicorn**, **Pydantic v2**, **Python 3.10+** | High-performance asynchronous REST API, request schema validation, and operational data models. |
| **Frontend & UI/UX** | **React 18**, **Vite 5**, **Leaflet**, **React-Leaflet**, **Lucide Icons** | Interactive single-page geospatial dashboard, multi-layer rendering, and Apple HIG circular icon design. |
| **Geospatial & Graph Analysis** | **NetworkX**, **SciPy**, **NumPy**, **Pillow**, **Haversine Math** | Road graph topology, Dijkstra shortest-path isolation routing, DEM RGB tile unpacking, and D8 terrain descent. |
| **Earth Observation & Data APIs** | **CDSE OData API**, **ohsome API**, **AWS Terrain Tiles (Terrarium)**, **Copernicus EMS** | Public Sentinel-1/2 catalogue search, pre-event OSM vector extracts, public DEM elevation data, and EMSR927 post-hoc validation. |
| **AI Models (In-App)** | **Sarvam AI** (`sarvam-105b`), **Ollama** (`llama3.2`, `gemma2:2b`) | Zero-hallucination bilingual (English & Nepali) situation reporting, Devanagari translation, and local offline inference. |
| **AI Coding Assistants (Disclosed)** | **Google Antigravity IDE** (Gemini 3.8 Flash), **Claude Code / Cursor** | Pair programming, rapid UI scaffolding, unit test generation, prompt tuning, and documentation structuring. |
| **Cloud Hosting & Deployment** | **Docker**, **Vercel**, **Firebase Hosting** | Containerized backend ASGI service and globally distributed CDN SPA frontend hosting. |

---

### Transparent AI Assistance Disclosure

| Project Subsystem | AI Assistant Used | What AI Generated / Assisted | What Human Engineers Authored & Verified |
|---|---|---|---|
| **1. Remote Sensing & Orbit Filtering** (`change_detection_pipeline.py`, `cdse_search.py`) | Claude Code / Antigravity | Scaffolding metadata dataclasses (`S1SceneMetadata`) and CDSE OData URL query formatting. | **Formulated the physical same-orbit Track 121 constraint**; proved why ascending vs descending passes create catastrophic $>10\text{ dB}$ mountain layover anomalies in Himalayan terrain; authored the $>18^\circ$ DEM slope exclusion filter. |
| **2. Downstream DEM Flow Routing** (`dem_trace.py`) | Antigravity (Gemini 3.8) | Boilerplate for web tile coordinate math (`lonlat_to_tile`, `tile_bounds`) and Terrarium RGB decoding formula. | **Authored the D8 steepest-descent matrix search loop**; calibrated the minimum descent gradient threshold (`MIN_SLOPE = 0.0005`) to prevent loops on river flats; verified flow path against Trishuli River coordinates. |
| **3. OSM Extraction & Road Graph Routing** (`ohsome_extract.py`, `jobs.py`) | Cursor / Antigravity | NetworkX boilerplate for adding nodes and edges from GeoJSON LineStrings. | **Enforced strict pre-event snapshot cutoff** ($\le\text{2026-07-27}$) to eliminate post-event data leakage; designed the endpoint-snapping tolerance; implemented Dijkstra shortest-path hospital isolation logic. |
| **4. Bilingual Rescue Copilot & SITREP** (`copilot_engine.py`, `sarvam_translate.py`) | Claude Code / Antigravity | Scaffolding Pydantic response schemas (`CopilotResponse`, `FactItem`, `MetricItem`) and Devanagari regex helpers. | **Engineered the zero-hallucination deterministic evidence composer**; guaranteed that no metric or coordinate is invented; authored the Devanagari whole-document translation coverage guard (`test_translation_coverage.py`). |
| **5. Frontend UI & Map Dashboard** (`DashboardView.jsx`, `CopilotView.jsx`, `index.css`) | Antigravity / Cursor | Tailwind/CSS layout helpers, SVG icon bindings, and React state boilerplates. | **Integrated Leaflet multi-layer toggle logic**; built the interactive split-screen satellite swipe comparison; connected live API endpoints; authored bilingual translation dictionaries (`translations.js`). |
| **6. Testing & Quality Assurance** (`test_*.py`) | Antigravity (Gemini 3.8) | Automated test case mock generation and parameter variations. | **Defined validation criteria and invariants** (e.g. asserting that HTTP 400 triggers on mismatched orbit tracks, and asserting that the Copilot never produces synthetic damage numbers). |
| **7. Single-Command Runner & Docker** (`run.py`, `run.bat`, `Dockerfile`) | Antigravity | Port-checking command line utilities (`netstat`, `taskkill`). | **Configured dual-service orchestration**, process signal traps (`SIGINT`), Uvicorn production port binding, and Vercel environment secrets. |

---

### Judge Q&A Guide: How the Core Code Works

If asked by an evaluator or judge, team members can walk through these exact mathematical and architectural mechanisms:

1. **How does D8 Downstream Elevation Tracing work?** (`backend/services/dem_trace.py`)  
   *Takes public AWS Terrarium PNG tiles, decodes elevation via $\text{Elev} = (R \times 256 + G + B / 256) - 32768$. For any cell $(r, c)$, evaluates the 8 neighboring cells $(r \pm 1, c \pm 1)$, computes slope $S = \frac{\Delta \text{Elevation}}{\text{Distance}}$, and steps in the direction of maximum positive gradient until slope $< 0.05\%$ or the boundary is reached.*
2. **Why must Sentinel-1 scenes share the same orbit track?** (`backend/ml/change_detection_pipeline.py`)  
   *Because Sentinel-1 is a side-looking synthetic aperture radar. Comparing an ascending image (looking East) with a descending image (looking West) causes massive geometric layover and shadow differences on mountain ridges that produce false $>10\text{ dB}$ anomalies unrelated to flooding. Only identical tracks (Track 121, 12-day repeat) share identical look angles.*
3. **How is road network isolation computed?** (`backend/services/jobs.py`)  
   *Constructs an undirected graph $G = (V, E)$ from pre-event OSM road geometries. Evaluates Dijkstra shortest paths $\text{dist}(u, v)$ from settlement nodes to hospital nodes. When road segments intersect flood extents or are severed, path cost becomes $\infty$ (`NetworkXNoPath`), flagging the settlement as cut off.*
4. **How does the Copilot guarantee Zero Hallucination?** (`backend/services/copilot_engine.py`)  
   *It uses a deterministic, fact-pinned retrieval pipeline. The language model is never prompted with open-ended generative instructions; instead, verified incident attributes (coordinates, casualties, severed bridges) are retrieved from SQLite and injected into a strict template. If a requested metric is missing, the system outputs an explicit data-gap disclosure rather than predicting a number.*

---

## Attributions & Licensing

* **Sentinel Satellite Imagery**: Contains modified Copernicus Sentinel data [2026], processed via the Copernicus Data Space Ecosystem (CDSE).
* **Elevation Data**: Derived from AWS Terrain Tiles (`elevation-tiles-prod`), incorporating SRTM and ETOPO open elevation models.
* **Map Vectors**: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, extracted using the Heidelberg Institute for Geoinformation Technology [ohsome API](https://ohsome.org/).
* **Validation References**: European Union, Copernicus Emergency Management Service data (Activation EMSR927).
* **AI Engine**: Sarvam AI (`sarvam-105b`) for Indian & Himalayan language fluency.
* **License**: Released under the [MIT License](LICENSE).
