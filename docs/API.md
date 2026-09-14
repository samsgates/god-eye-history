# API

## Public
- `GET /health`
- `GET /api/config`
- `GET /api/places/search?q=London%2015%20August%201960`
- `GET /api/places/reverse?lat=51.5&lng=-0.12`
- `GET /api/history/events?lat=51.5&lng=-0.12&radius=15&start=1960-08-15&end=1960-08-15`
- `GET /api/history/events/:id`
- `GET /api/history/day/:date`
- `GET /api/history/timeline`
- `GET /api/history/compare`
- `GET /api/history/media`
- `GET /api/history/this-day/:MM-DD`
- `POST /api/ai/history`
- `GET /api/present/:layer`
- `GET /api/stories`
- `GET /api/stories/:id`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/bookmarks`
- `GET /api/bookmarks`

## AI request

```json
{
  "question": "What happened here?",
  "provider": "auto",
  "context": {
    "date": "1960-08-15",
    "place": {"name":"London","lat":51.507,"lng":-0.127}
  }
}
```
