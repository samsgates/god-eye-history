# Architecture

```text
Browser / Cesium
      |
      +-- History Controller ---- Timeline / Compare / Story
      |          |
      |          +---- /api/history/*
      |
      +-- AI Chat --------------- /api/ai/history
      |
      +-- Present Mode ---------- /api/present/*
                    |
              Express API
                    |
       +------------+-------------+
       |            |             |
     PostGIS      Redis        OpenSearch
       |
 Historical source connectors
 Wikidata / Wikimedia / Europeana / OpenHistoricalMap
                    |
               AI Gateway
          OpenAI / Gemini / Claude
```

## Rules

1. History retrieval is independent from model providers.
2. AI receives source-grounded evidence.
3. Location and date precision remain explicit.
4. Globe rendering receives only the current viewport/time subset.
5. Present-day intelligence is an optional mode, not the default product surface.
