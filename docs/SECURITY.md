# Security

- Never prefix client-exposed Vite variables with private API secrets.
- OpenAI, Gemini, Claude, Europeana and present-day provider keys remain server-side.
- Browser requests only same-origin `/api/*`.
- Passwords use bcrypt cost 12.
- JWT signing secret must be replaced in production.
- Deploy behind TLS.
- Apply rate limits at the edge or reverse proxy.
- Add account email verification before enabling public sign-up.
- BYOK production storage should use KMS/envelope encryption. Do not put raw keys in localStorage.
- Treat external archive text as untrusted data, not instructions.
- The AI orchestrator intentionally caps tool execution to prevent runaway loops.
- Server HTTP adapters use finite request timeouts.
- Third-party URLs shown to users are source metadata. Never proxy arbitrary user-supplied URLs.

- Google Map Tiles API keys are necessarily delivered to the browser when Photorealistic 3D is enabled. Restrict them by HTTP referrer, API, quota, and billing controls. Treat them differently from private AI/database credentials.
