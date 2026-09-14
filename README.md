# god-eye-history

**Explore any place on Earth through time.**

`god-eye-history` is an AI-powered historical Earth experience built around the same Cesium-first spatial architecture that makes God's Eye View compelling, but with history as the default coordinate system.

## What is implemented

- Cesium 3D globe with click-anywhere exploration
- natural-language place/date search
- historical date + year timeline
- playback by day/month/year/decade
- historical event markers with confidence and precision
- adaptive radius search
- same-day worldwide mode
- OpenHistoricalMap overlay
- Then/Now fade comparison
- event detail with sources and uncertainty
- historical photo/media connectors
- Wikidata + Wikimedia + Europeana source connectors
- PostgreSQL/PostGIS canonical event model
- Redis cache with in-memory fallback
- AI gateway with OpenAI, Gemini, Claude and automatic failover
- retrieval-first grounded historical Q&A
- voice input fallback through browser speech recognition
- story director and guided historical scenes
- present-day compatibility mode for aircraft, earthquakes, cameras and provider adapters for the remaining upstream live layers
- date-aware annotations + GeoJSON export
- share-state links
- guest mode
- account/bookmark APIs
- admin data-quality endpoint
- Docker, migrations, seed data, workers and tests
- keyless graceful-degradation mode

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:4173`.

The browser app can boot without AI keys. Public source providers may rate-limit anonymous traffic, so PostGIS ingestion is recommended for production.

## Full local stack

```bash
cp .env.example .env
docker compose up -d postgres redis opensearch
npm run db:migrate
npm run db:seed
npm run dev
```

## AI providers

Set any combination:

```env
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
DEFAULT_AI_PROVIDER=auto
```

The server uses a canonical tool schema and native REST APIs for each provider. No provider key is exposed to the browser.

## Historical data model

The canonical event model explicitly stores both temporal and spatial precision. A city-level source is never silently converted into a fake street-level coordinate.

Core query:

```sql
ST_DWithin(event.location, selected_point, radius)
AND event.date_start <= selected_end
AND event.date_end >= selected_start
```

## Production data

The app tries PostGIS first. If no local records match, it falls back to Wikidata. A very small embedded dataset exists only to keep first-run demos usable when upstream services are unavailable.

Recommended production ingestion:

1. Pull structured events from Wikidata.
2. Normalize date and location precision.
3. Deduplicate into canonical event clusters.
4. Attach Wikimedia/Europeana media metadata.
5. Score sources and confidence.
6. Index textual metadata into OpenSearch.
7. Serve only viewport + time-window data.

## Present-day compatibility

The original concept's live data is intentionally hidden behind **Present** mode.

Implemented directly:
- USGS earthquakes
- OpenSky aircraft
- TfL public cameras

Compatibility adapters included:
- vessels/AIS
- satellites/TLE
- NASA FIRMS fires
- TomTom traffic
- GBFS bike share
- infrastructure/OSM

These require the corresponding provider feed or licensed key.

## Commands

```bash
npm run doctor
npm test
npm run build
npm run db:migrate
npm run db:seed
npm run ingest:wikidata -- 1947-08-15
npm run ingest:europeana -- "London 1960"
```

## Security

- secrets stay server-side
- Helmet headers
- JWT auth
- bcrypt password hashing
- server-side BYOK architecture boundary
- bounded outbound HTTP requests
- no model is treated as a historical source

See `docs/SECURITY.md`.

## Licensing

This repository is MIT licensed. Historical/media/live data sources have their own terms. See `DATA_SOURCES.md` and `ATTRIBUTIONS.md`.
