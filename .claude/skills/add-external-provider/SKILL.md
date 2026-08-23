---
name: add-external-provider
description: Add a new external (cloud) LLM provider type (like OpenRouter, Vercel AI Gateway) to Cannonade. Covers the provider factory, shared defaults, and registration — no renderer changes needed. Requires a local docs file for the provider's API before starting.
---

Providers are configuration-driven: the user adds provider *instances* at runtime via the Add Provider modal, and the main process builds them from registered *factories*. Adding a new provider type touches only 3 locations — one shared defaults entry, one new folder under `src/core/providers/`, and one registration line. The renderer requires **zero changes**. External providers are simpler than local ones: they only implement `fetchExternalModels` and `chat` — no downloads, loading, or server control.

## Pre-requisite: Provider documentation

Before starting any development, check if there is any documentation about the provider we are adding at `local_docs/<provider-type>/`. If there is none, ask user how to proceed.

The docs should cover:
- The npm package name (or HTTP API) used to talk to the provider
- How to list available models and what fields the response carries
- How to send a chat request (and whether an OpenAI-compatible endpoint exists)
- The default base URL, authentication method, and error response format

Do not make assumptions about the API — derive every implementation detail from the docs. If there are important decisions to make, ask the user for confirmation by providing options.

## Reference implementations

- `src/core/providers/openrouter/` — plain `fetch` against an OpenAI-compatible API, chat reuses `../openai-compat/mappers`
- `src/core/providers/vercel/` — SDK-based streaming chat with real timing stats, REST for model listing

---

## Step 1 — `src/shared/provider/configured-provider.ts`

Add an entry to `KNOWN_PROVIDER_DEFAULTS`:

```ts
<provider-type>: {
  displayName: '<Provider Display Name>',
  description: '<Short one-line description shown on the type card>',
  defaultUrl: '<default-base-url>',
  singleton: true,
  supportsRemote: false,
  isExternal: true,
  requiresApiKey: true,
  defaultEnvVar: '<PROVIDER>_API_KEY'
}
```

`isExternal: true` is what makes it an external provider — the renderer's provider lists, Add Provider modal card, and auth UI all follow from this entry.

---

## Step 2 — `src/core/providers/<provider-type>/` *(new folder)*

```
src/core/providers/<provider-type>/
  index.ts          factory + all I/O (fetch / SDK client)
  types.ts          provider API response/request types
  mappers.ts        functions mapping provider types <-> shared types
  mappers.test.ts   unit tests for the mappers
```

### `index.ts` — the factory

```ts
export function create<Provider>Provider(
  instanceId: string,
  url: string,
  apiKey?: string
): LLMProvider {
  return {
    id: instanceId,
    capabilities: {
      chat: true,
      localModels: false,
      externalModels: true,
      downloadModel: false,
      downloadStatus: false,
      deleteModel: false,
      loadModel: false,
      serverControl: false,
      requiresApiKey: true
    },
    async fetchExternalModels(): Promise<ExternalModel[]> { ... },
    async chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> { ... }
  }
}
```

Key rules:
- Use `authHeader(apiKey)` from `@shared/provider/api-key` for HTTP auth headers.
- Honor `options?.abortSignal` in `chat`.
- Use `createLogger('<provider-type>')`, never `console.*`.
- If the provider speaks the OpenAI chat-completions format, reuse `toChatRequest` / `toChatResponse` from `../openai-compat/mappers` (see `openrouter/`). If chat streams, accumulate chunks with timestamps to fill `tokens_per_second` and `time_to_first_token_seconds` (see `vercel/`); non-streaming providers leave them 0.

### `mappers.ts` — mapping only

No I/O — mappers take provider API objects (including error responses and thrown errors, mapped to `ProviderError` from `../base`) in and return shared types out. Logging via `createLogger` is fine. Unit-test them in `mappers.test.ts` (see `openrouter/mappers.test.ts` and `vercel/mappers.test.ts` for the pattern).

`ExternalModel` mapping guidelines (`@shared/provider/external-model`):
- `id` / `name`: the provider's model identifier and display name
- `publisher`: model owner; fall back to the part of `id` before `/`
- `providerId`: the `instanceId` passed to the factory (not the provider type)
- `contextLength`: required, `0` when unknown
- `inputModalities` / `outputModalities`: use explicit API fields when available; only infer from tags/type as fallback (values from `ModelModality`)
- `pricing`: normalize per-token price strings with `perTokenToPerMillion` (`@shared/utils/number`); omit `pricing` entirely when input/output prices are missing or negative
- `createdAt` / `releasedAt`: map only what the API provides — the release-date sort falls back to `createdAt` when `releasedAt` is missing
- `raw`: always set `{ ...m }` so the UI can show the raw endpoint JSON
- Map every remaining optional field the API provides (`maxOutputTokens`, `supportedParameters`, `knowledgeCutoff`, ...)

---

## Step 3 — `src/core/providers/index.ts`

```ts
import { create<Provider>Provider } from './<provider-type>'

registerProviderFactory('<provider-type>', create<Provider>Provider)
```

---

## Checklist

- [ ] `local_docs/<provider-type>/` read and understood
- [ ] `src/shared/provider/configured-provider.ts` — entry added with `isExternal: true`
- [ ] `src/core/providers/<provider-type>/index.ts` — factory with `chat` + `externalModels` capabilities
- [ ] `src/core/providers/<provider-type>/types.ts` — provider API types
- [ ] `src/core/providers/<provider-type>/mappers.ts` — mappers including error mapping
- [ ] `src/core/providers/<provider-type>/mappers.test.ts` — mapper unit tests
- [ ] `src/core/providers/index.ts` — factory registered
- [ ] No changes under `src/renderer/`
- [ ] `npm run validate` passes
