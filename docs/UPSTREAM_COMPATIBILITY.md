# God's Eye View compatibility map

The requested base repository is a fork of the public God's Eye View codebase. This implementation preserves the architectural ideas that are valuable for history and intentionally isolates live intelligence under Present Mode.

| Upstream capability | god-eye-history implementation |
|---|---|
| Cesium globe | `src/globe/globe.js` |
| Camera fly-to | `HistoryGlobe.flyTo()` |
| Click-to-inspect | Event/map click handlers |
| Click/track | Cesium entity tracking primitive retained |
| Map source switching | Cesium base picker + OHM + optional Google 3D |
| Photorealistic 3D | Optional Google Map Tiles 3D |
| OSM/geographic search | Nominatim server adapter |
| HUD | Historical date/event/scope/AI HUD |
| Share state | Encoded view state in URL |
| Visual styles | Default/Night/Archive/Clean |
| Clean recording view | Annotation panel clean mode |
| Scenes | Historical `StoryDirector` |
| Annotations | Date-aware point annotations + GeoJSON export |
| Voice | Browser voice input and server AI gateway boundary |
| OpenAI control | OpenAI native provider adapter |
| Live aircraft | OpenSky adapter |
| Live earthquakes | USGS adapter |
| CCTV | TfL JamCam adapter |
| Vessels/AIS | Provider adapter boundary retained |
| Satellites/TLE | Provider adapter boundary retained |
| NASA FIRMS | Key-aware provider boundary retained |
| Traffic | TomTom provider boundary retained |
| Bike share | GBFS configuration retained |
| Infrastructure | OSM/provider boundary retained |
| Performance controls | Cesium requestRenderMode, marker limits, OHM tile budget |
| Provider settings | Environment/provider configuration and AI Settings UI |

Advanced feed-specific behavior from any upstream deployment remains replaceable behind `server/present/providers.js`, so organizations can attach the same licensed data feeds they already use without coupling them to historical logic.
