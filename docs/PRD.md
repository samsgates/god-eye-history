# god-eye-history Product Requirements

## Vision
Explore any place on Earth through time.

## Core experience
The primary state of the product is `place + time + evidence`. Users search or click anywhere, choose an exact date or a broad era, inspect historical events and media, compare past and present, ask source-grounded questions, and continue through related places/dates.

## Product principles
1. Map first.
2. Time is a first-class coordinate.
3. Exploration must work without knowing what to search.
4. Source before story.
5. Never hide historical uncertainty.
6. Progressive disclosure for complex controls.
7. Preserve useful God's Eye View spatial primitives.

## Main capabilities
- Cesium 3D Earth.
- Place search and reverse-geographic context.
- Date, year, era and range exploration.
- Timeline playback.
- Event density mode.
- Historical event layer categories.
- OpenHistoricalMap date-filtered vector features.
- Modern satellite/3D context with optional Google Photorealistic 3D Tiles.
- Then/Now comparison.
- What-was-here exploration.
- Same-date worldwide exploration.
- Historical media from Wikimedia and Europeana.
- Historical stories and camera scenes.
- Date-aware annotations.
- Present-day context kept in a separate mode.
- AI historian with OpenAI, Gemini and Claude.
- Retrieval-first source grounding and confidence.
- Authentication, bookmarks, collections and settings APIs.
- Admin data-quality/source-health endpoints.
- PostGIS canonical historical store.
- Redis caching, OpenSearch mapping and ingestion workers.
- Responsive/mobile layout.
- Shareable state.

## Historical entity model
Every event preserves:
- temporal start/end
- temporal precision/confidence
- geographic coordinates/geometry
- geographic precision/confidence
- modern and historical place names
- categories
- people/organizations/places
- media
- sources
- importance and confidence

## Historical query expansion
When exact records are sparse, the product can progressively widen:
1. exact point + exact date
2. 1 km + exact date
3. 5 km + exact date
4. city + exact date
5. city + broader time
6. region/country
7. global same date

The UI must state the scope. It must not imply that a city-level source is an exact street-level event.

## AI
Provider-neutral gateway:
- OpenAI Responses API
- Gemini GenerateContent API
- Claude Messages API

The application retrieves evidence before model generation. Tool access is bounded and canonical. The no-key fallback remains usable through retrieval-only summaries.

## Source priorities
- Wikidata for structured event/entity backbone
- Wikimedia Commons for geospatial media
- Europeana for cultural heritage media/metadata
- OpenHistoricalMap for temporal map features
- local PostGIS as production canonical store

## Present mode
Live features remain separate from History Mode:
- aircraft
- vessels
- satellites
- earthquakes
- fires
- public cameras
- traffic
- bike share
- infrastructure

## Security
Private provider secrets remain server-side. Google Map Tiles keys are browser-visible by design and must be API/referrer restricted. Historical archive text is untrusted evidence, never instructions.

## Success metrics
- historical explorations/session
- places and dates explored
- event opens
- timeline interactions
- same-day mode use
- AI questions
- story completion
- bookmarks/shares
- citation coverage
- unsupported-claim rate

## Production direction
Use PostGIS for spatial/temporal filtering, Redis for hot-cache/rate controls, OpenSearch for full-text/semantic retrieval and S3-compatible object storage only where licensing permits.
