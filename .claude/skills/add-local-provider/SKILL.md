---
name: add-local-provider
description: Add a new local LLM provider type (like Ollama, LM Studio) to Cannonade. Covers the provider factory, shared defaults, and registration — no renderer changes needed. Requires a local docs file for the provider's API before starting.
---

Providers are configuration-driven: the user adds provider *instances* at runtime via the Add Provider modal, and the main process builds them from registered *factories*. Adding a new provider type touches only 3 locations — one shared defaults entry, one new folder under `src/core/providers/`, and one registration line. The renderer requires **zero changes**: the Add Provider modal, provider store, and all views derive everything from `KNOWN_PROVIDER_DEFAULTS` and the provider's `capabilities` object.

## Pre-requisite: Provider documentation

Before starting any development, check if there is any documentation about the provider we are adding at `local_docs/<provider-type>/`. If there is none, ask user how to proceed.

The docs should cover:
- The npm package name (or HTTP API) used to talk to the provider
- How to list available models
- How to check which models are currently loaded/running (if supported) 
- How to load and unload a model (if supported) 
- How to send a chat request (and whether an OpenAI-compatible endpoint exists)
- How to download a model and track download progress (if supported)
- How to delete a model (if supported)
- The default base URL / host, and whether the API can require an API key

Read these files before writing any code. Do not make assumptions about the API, derive every implementation detail from the docs. Use the docs to fill in the `LLMProvider` methods and the `capabilities` object accurately. If there are important decisions to make (architectural decisions, unsupported provider features, etc.), ask the user for confirmation by providing options.

---

## Architecture overview

- `ConfiguredProvider` (`src/shared/provider/configured-provider.ts`) — a user-configured instance: `{ instanceId (UUID), type, displayName, url, isDefault, isRemote?, authMethod?, envVarName? }`. Instances are persisted in `AppSettings.configuredProviders` and synced to the main process (`PROVIDER.SYNC` → `buildRegistry`).
- `LLMProvider` (`src/core/providers/base.ts`) — the interface a factory returns. All methods are optional; `capabilities` declares which ones exist. `buildRegistry` **validates** that every capability set to `true` has its matching method implemented, and throws otherwise.
- Factories receive `(instanceId, url, apiKey?, remote?)`. The API key is already resolved (from the OS keychain or an env var) by `resolveApiKey` before the factory is called — the provider just uses it.
- Shared layers stay pure: `src/shared/provider/*` and `src/core/providers/openai-compat/*` contain only types and mappers. All I/O (fetch, SDK clients, child processes) lives inside the provider's own folder. Provider-specific API types go in the provider's `types.ts`, never in shared.

---

## Step 1 — `src/shared/provider/configured-provider.ts`

Add an entry to `KNOWN_PROVIDER_DEFAULTS`:

```ts
export const KNOWN_PROVIDER_DEFAULTS = {
  // ...existing entries...
  <provider-type>: {
    displayName: '<Provider Display Name>',
    description: '<Short one-line description shown on the type card>',
    defaultUrl: '<default-base-url>',
    singleton: false,
    supportsRemote: <bool>,
    isExternal: false,
    requiresApiKey: false,
    defaultEnvVar: '<PROVIDER>_API_KEY'
  }
} as const
```

`ProviderType` widens automatically. `isExternal: false` is what makes it a *local* provider — the renderer's `localProviders` computed, the Add Provider modal card, icons, and auth UI all follow from this entry with no further changes.

---

## Step 2 — `src/core/providers/<provider-type>/` *(new folder)*

Follow the existing folder layout (`ollama/` is the cleanest reference; `lmstudio/` shows server control and SDK usage):

```
src/core/providers/<provider-type>/
  index.ts          factory + all I/O
  types.ts          provider API response/request types
  mappers.ts        pure functions mapping provider types <-> shared types
  mappers.test.ts   unit tests for the mappers
```

### `index.ts` — the factory

```ts
import type { LLMProvider } from '../base'
import type { LocalModel } from '@shared/provider/local-model'
import type { ChatRequest, ChatResponse, ChatOptions } from '@shared/provider/chat'
import type { DownloadModelResponse, DownloadStatusResponse } from '@shared/provider/ipc-contracts'
import { authHeader } from '@shared/provider/api-key'
import { toLocalModel, toChatRequest, toChatResponse } from './mappers'
import { createLogger } from '../../../main/logger'

const log = createLogger('<provider-type>')

export function create<Provider>Provider(
  instanceId: string,
  url: string,
  apiKey?: string,
  remote = false
): LLMProvider {
  const client = /* npm client or fetch wrapper using url + authHeader(apiKey) */
  const downloadJobs = new Map<string, DownloadStatusResponse>()

  return {
    id: instanceId,

    capabilities: {
      chat: <bool>,
      localModels: <bool>,
      externalModels: false,
      downloadModel: <bool>,
      downloadStatus: <bool>,
      deleteModel: <bool>,
      loadModel: <bool>,
      serverControl: <bool>,
      requiresApiKey: false,
      modelRegistryUrl: '<optional: provider model library url>',
      huggingFaceModelsUrl: '<optional: hf filter url for this provider>'
    },

    async fetchLocalModels(): Promise<LocalModel[]> { ... },
    async chat(request: ChatRequest, options?: ChatOptions): Promise<ChatResponse> { ... },
    async deleteModel(modelId: string): Promise<void> { ... },
    async downloadModel(modelName: string): Promise<DownloadModelResponse> { ... },
    async getDownloadStatus(jobId: string): Promise<DownloadStatusResponse> { ... },
    async loadModel(modelId: string): Promise<void> { ... },
    async unloadModel(loadedInstanceId: string): Promise<void> { ... }
  }
}
```

Key rules:
- Implement **exactly** the methods your capabilities declare — `buildRegistry` throws on any mismatch.
- Some capabilities may depend on `remote` (e.g. LM Studio sets `deleteModel: !remote, serverControl: !remote`). Only accept the `remote` param if the defaults entry has `supportsRemote: true`.
- Use `authHeader(apiKey)` from `@shared/provider/api-key` for HTTP auth headers, even if the provider rarely needs a key.
- Throw `ProviderError` (from `../base`) for HTTP-level failures where you can extract a status/message.
- Use `createLogger('<provider-type>')`, never `console.*`.

### `mappers.ts` — mapping only

No I/O — mappers take provider API objects (including error responses and thrown errors, mapped to `ProviderError`) in and return shared types out. Logging via `createLogger` is fine. Unit-test them in `mappers.test.ts` (see `ollama/mappers.test.ts` for the pattern).

`LocalModel` mapping guidelines (`@shared/provider/local-model`):
- `id`: unique model identifier (whatever the provider uses as a key)
- `name`: human-readable display name
- `providerId`: the `instanceId` passed to the factory (not the provider type)
- `sizeBytes`: model size in bytes
- `type`: `'llm'` or `'embedding'` — infer from model name or metadata
- `loadedInstances`: array of `{ id, config? }` per running instance; empty array if not loaded
- `meta`: flat `Record<string, string | number>` for extra info (family, params, quant, etc.)

Chat mapping guidelines (`@shared/provider/chat`):
- `ChatRequest` carries either `messages` (multi-turn) or `input` (`string` or `InputItem[]`) plus `system_prompt` — handle both; prepend `system_prompt` as a system message when the messages don't already contain one (see `ollama/mappers.ts` `toChatMessages`)
- Pass through `temperature`, `top_p`, `top_k`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`, `seed`, `max_output_tokens`
- Return a `ChatResponse` with `model_instance_id`, `output` (`OutputItem[]`, `reasoning` item first if the model produced thinking, then the `message` item), and `stats`
- Honor `options?.abortSignal` in `chat` — pass it to `fetch`, or wire an `abort` listener onto the stream (see `ollama/index.ts`)

If the provider speaks the OpenAI chat-completions format, do **not** write chat mappers — reuse `toChatRequest` / `toChatResponse` from `../openai-compat/mappers` (see `custom/index.ts` and the LM Studio multi-turn path).

Download job pattern (when the provider streams progress rather than exposing a job API):
- Module-level per-instance `Map<string, DownloadStatusResponse>` as the job registry
- Generate a `jobId` via `crypto.randomUUID()`
- Start the download as a fire-and-forget async IIFE, return `{ job_id: jobId, status: 'downloading' }` immediately
- Update the map on each progress chunk; set `'completed'` or `'failed'` at the end

---

## Step 3 — `src/core/providers/index.ts`

Register the factory:

```ts
import { create<Provider>Provider } from './<provider-type>'

registerProviderFactory('<provider-type>', create<Provider>Provider)
```

---

## No renderer changes

Everything downstream is generic:
- **Add Provider modal** lists type cards from `KNOWN_PROVIDER_DEFAULTS` and handles URL, remote toggle, auth method, and connection testing (`PROVIDER.TEST_CONNECTION_URL` builds a throwaway probe provider via your factory).
- **Providers store / views** operate on `ConfiguredProvider` instances and query `capabilities` over IPC to show/hide features (download, delete, load, server control).
- **Settings persistence** flows through `AppSettings.configuredProviders` automatically.

If you find yourself editing anything under `src/renderer/` to add a provider type, stop — that's a sign the design drifted; ask the user.

---

## Checklist

- [ ] `local_docs/<provider-type>/` listed, and every file in it read and understood
- [ ] `src/shared/provider/configured-provider.ts` — entry added to `KNOWN_PROVIDER_DEFAULTS` with `isExternal: false`
- [ ] `src/core/providers/<provider-type>/index.ts` — factory returning `LLMProvider`, capabilities matching implemented methods
- [ ] `src/core/providers/<provider-type>/types.ts` — provider API types
- [ ] `src/core/providers/<provider-type>/mappers.ts` — pure mappers to shared types
- [ ] `src/core/providers/<provider-type>/mappers.test.ts` — mapper unit tests
- [ ] `src/core/providers/index.ts` — factory registered
- [ ] No changes under `src/renderer/`
- [ ] `npm run validate` passes
