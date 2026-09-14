# AI Gateway

The application supports native REST integrations for:

- OpenAI Responses API
- Google Gemini `generateContent`
- Anthropic Messages API

All providers receive the same logical contract:

```text
generate(system, input, tools)
 -> text
 -> tool calls
```

Canonical tools:
- search_places
- search_historical_events
- search_same_day_worldwide
- get_event_details
- get_historical_media

## Grounding

Retrieval happens before the model call. The model receives canonical historical records and their sources. A single bounded tool round is allowed to enrich evidence. The server then asks the model to synthesize only from that material.

If no AI provider is configured, the UI remains usable and returns a retrieval-only answer.

## Routing

`DEFAULT_AI_PROVIDER=auto` chooses the first configured provider and applies configured fallbacks on request failure.
