# Low-Level Design

## Client state
`src/core/state.js` is intentionally small and observable. State transitions happen through `update` and `setDate`.

## Globe
`HistoryGlobe` provides:
- `flyTo`
- `renderEvents`
- `renderPresent`
- `setHistoricalMap`
- `setHistoricalOpacity`
- annotation methods
- click and camera callbacks

## History query
`HistoryController.loadEvents()` builds date/location/radius/category parameters and calls `/api/history/events`.

## Event fallback
1. PostGIS
2. Wikidata
3. embedded verified demo seeds

## AI
`askHistory()` retrieves evidence first, resolves provider order, calls a native adapter, runs at most eight canonical tools once, then asks for final synthesis.

## Caching
Redis when configured. Bounded in-memory cache otherwise.
