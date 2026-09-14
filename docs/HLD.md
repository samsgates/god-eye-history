# High-Level Design

## Spatial runtime
Cesium owns camera, terrain, imagery, entities, tracking and annotation rendering.

## Temporal runtime
A shared temporal state controls selected date, year, playback speed and history refresh.

## Historical engine
PostGIS handles point/radius/date intersection. Wikidata is the structured fallback. Media metadata comes from Wikimedia Commons and Europeana.

## AI runtime
Provider-neutral gateway with retrieval-first grounding and provider fallback.

## Story runtime
A story is a sequence of camera/place/date/narration scenes. It reuses normal history queries instead of shipping duplicated story facts.

## Live compatibility runtime
Present-day providers are separated from history and render through the same entity layer abstraction.
