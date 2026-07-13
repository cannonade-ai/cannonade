# OpenRouter Integration Plan

Goal: make OpenRouter a fully working provider — browsable external model catalog (row layout with search, filters, pagination), chat in Playground, and usable in Test Runs. Existing external-provider files are treated as disposable; anything below that conflicts with them replaces them.

## 1. Shared types — rework `ExternalModel`

**File: `src/shared/provider/external-model.ts`** (rewrite)

Replace the current `meta: Record<string, unknown>` bag with explicit typed fields. Every gateway mapper normalizes into this shape, so the UI never casts.

```ts
export interface ExternalModelPricing {
  inputPerMTokens: number
  outputPerMTokens: number
  cacheReadPerMTokens?: number
}

export type ModelModality = 'text' | 'multimodal'

export interface ExternalModel {
  id: string
  name: string
  publisher: string
  providerId: string
  description?: string
  contextLength: number
  maxOutputTokens?: number
  modality?: ModelModality
  pricing?: ExternalModelPricing
  supportedParameters?: string[]
  createdAt?: number
}
```

Notes:
- Pricing normalized to **USD per 1M tokens** as numbers. OpenRouter returns per-token strings (`"0.000003"`); the mapper converts. Zero pricing means free — UI renders a "Free" badge, not `$0.00`.
- `cacheReadPerMTokens` maps from OpenRouter `pricing.input_cache_read` when present; shown in the expanded row only.
- `publisher` is derived in the mapper (`id.split('/')[0]`), not in components.
- `modality` collapses OpenRouter's `architecture.modality` strings (`text->text`, `text+image->text`, …) into a small enum; keep raw string out of the type.

## 2. Core provider — rewrite `src/core/providers/openrouter/`

- **`types.ts`**: full typed shape of OpenRouter `GET /models` response (id, name, description, context_length, architecture, pricing, top_provider, supported_parameters, created).
- **`mappers.ts`**: `toExternalModel` producing the new shape, including pricing normalization ($/token string → $/1M number) and modality mapping. Models whose output modality is not text (e.g. image generation) are dropped here and never reach the UI. Add `mappers.test.ts` mirroring the existing provider mapper tests (ollama/lmstudio/custom all have one).
- **`index.ts`**: capabilities `{ chat: true, externalModels: true, localModels: false, requiresApiKey: true, ...rest false }`.
  - `fetchExternalModels()` — `GET {base}/models` (auth header optional here; OpenRouter serves the catalog without a key, so the catalog works even before a key is set).
  - `chat()` — OpenRouter is OpenAI-compatible: `POST {base}/chat/completions`.

**Prerequisite**: the chat implementation follows the OpenRouter chat API documentation at `docs/openrouter/README.md` (placeholder created, uncommitted — content to be provided). Do not implement `chat()` from memory; the catalog/`fetchExternalModels` work is not blocked on it.

**Extract shared OpenAI-compat chat** instead of duplicating the custom provider:
- New `src/core/providers/openai-compat/` holding `toChatRequest`, `toChatResponse`, response types, and a `chatViaOpenAI(base, auth, request, options)` helper — moved out of `src/core/providers/custom/mappers.ts` / `custom/types.ts` (custom provider re-exports/uses it; its tests move along).
- OpenRouter's `chat()` uses the same helper, plus OpenRouter-specific bits: `HTTP-Referer`/`X-Title` headers (OpenRouter app attribution), and mapping `reasoning` request field to OpenRouter's `reasoning: { effort }` param.

**Error handling**: map `401` → "Invalid or missing OpenRouter API key", `402` → "Insufficient OpenRouter credits", `429` → "Rate limited by OpenRouter" using `ProviderError` from `src/core/providers/base.ts`, so stores can show friendly messages.

**Registration**: verify the factory is registered in `src/core/providers/index.ts` and that `TEST_CONNECTION` / `TEST_CONNECTION_URL` probing works for a provider without `fetchLocalModels` (probe should call `fetchExternalModels` when `capabilities.externalModels`).

## 3. IPC / preload / renderer API

`PROVIDER.FETCH_EXTERNAL_MODELS` already exists end-to-end (`ipc-channels.ts`, `main/ipc/handlers.ts`, `preload/index.ts`, `renderer/api/index.ts`). Verify the handler surfaces `ProviderError` messages cleanly; no new channels expected. Chat already routes through the generic `PROVIDER.CHAT` handler by `instanceId`, so OpenRouter chat needs no IPC work.

## 4. Providers store — active external provider

**File: `src/renderer/src/stores/providers.ts`**

Add alongside `activeLocalProvider`:
- `externalProviders` computed — `configuredProviders` filtered by `KNOWN_PROVIDER_DEFAULTS[type].isExternal`.
- `activeExternalProvider` computed + `setExternalProvider()` override, same default-then-first fallback pattern as local.

Move the `externalProvider` ref out of `src/renderer/src/stores/models.ts` (it belongs with provider selection, and `loadExternalModels()` reads `activeExternalProvider` instead). Add a `localProviders` computed too, and switch `LocalModelsView` / local-only surfaces to it so external providers stop appearing in local provider dropdowns.

## 5. Navigation + sidebar

- `src/renderer/src/stores/navigation.ts`: add `'external-models'` to `View`.
- `src/renderer/src/components/AppSidebar.vue`: new nav item "External Models" (e.g. `IconWorld` / `IconCloud` from tabler), rendered only when `externalProviders.length > 0`.
- `src/renderer/src/views/index.ts` + `App.vue` view switch: register `ExternalModelsView`.

## 6. External Models view — row layout

**Delete** `src/renderer/src/components/ExternalModelCard.vue`.

**New view: `src/renderer/src/views/ExternalModelsView.vue`**
Mirrors `LocalModelsView` structure: `SectionHeader` with provider `Select` (external providers only) + Refresh button (F5 via `useShortcut`), loading/error/empty states, "no key configured" state linking to `navStore.openSettings('providers')`.

**New components in `src/renderer/src/components/external-models/`:**

- **`ExternalModelTable.vue`** — owns filter/sort/pagination state; receives `models: ExternalModel[]`. All filtering client-side (OpenRouter returns the full catalog in one call, ~400 entries — no server paging exists).
- **`ExternalModelTableFilters.vue`** — search `Input` (matches name, id, publisher), modality filter (`Select` or toggle), sort `Select` (newest, name, input price, output price, context length). Default sort: newest first (`created` desc).
- **`ExternalModelTableRow.vue`** — expandable row.
  - Collapsed: model name, publisher, context length, input $/1M, output $/1M, modality `Badge`, "Free" badge when pricing is zero, chevron.
  - Expanded: description, max output tokens, supported parameters as badges, full model id with `CopyButton`, created date. Reuse `Chevron`, `Badge`, `CopyButton`, `Collapse` patterns from `components/ui`.

**Pagination — new ui component `src/renderer/src/components/ui/Pagination.vue`** (generic: `page`, `pageSize`, `total`, `update:page` event; register in `components/ui/index`). Page size ~50. Filter/sort reset to page 1.

**Formatting**: extend `src/renderer/src/utils/format.ts` — `formatPrice` now takes the numeric per-1M value (`$3.00 / 1M`), keep `formatContext`.

**Models store** (`src/renderer/src/stores/models.ts`): keep `externalModels` + `loadExternalModels()`, pointed at `activeExternalProvider`; cache per provider instance in-memory for the session so switching views doesn't refetch. The Refresh button in `SectionHeader` (and F5) bypasses the cache and refetches the catalog on demand.

## 7. Playground integration

`src/renderer/src/stores/playground.ts` already surfaces any chat-capable provider, so OpenRouter appears once its capabilities say `chat: true`. Remaining gap: `selectProvider` loads models via `fetchLocalModels`. Change model loading to branch on capabilities — `externalModels` → `fetchExternalModels` mapped to `{ id, name }` options (no `type === 'llm'` filter; all catalog entries are chat models). Model `Select` at 400 entries: give the playground model select a search/filter capability (extend `Select.vue` with an optional `searchable` prop) — needed regardless of OpenRouter, but this is the forcing function.

## 8. Test Runs integration

**Shared type: `src/shared/app/test-run.ts`** — add a fourth `ModelRef` variant:

```ts
export interface ExternalModelRef {
  source: 'external'
  modelId: string
}
```

**`src/renderer/src/components/test-runs/NewRunPanel.vue` / `NewRunModelSelector.vue`**:
- Provider select includes external providers.
- When the selected provider is external: hide Installed/Registry/HuggingFace sections and show a searchable external-model picker (reuse the filter logic from the External Models view; a compact searchable checklist like the existing `installed-list`). Selected models become `{ source: 'external', modelId }` chips.
- Hide local-only run options for external providers (unload before/after, delete auto-downloaded); keep `parallelRun` (already external-only), timeout.

**`src/main/services/test-runner/model-runner.ts` + `model-manager.ts`**:
- `source: 'external'` → `modelKey = modelId`, skip download/resolve, skip `isModelLoaded`/`loadModel` (already capability-gated, but the `source` switch must handle the new variant), skip delete-after-run.
- Extend `index.test.ts` with an external-ref case.

## 9. Settings polish

- `SettingsModalProviderCard`: external providers shouldn't render `SettingsModalProviderCardServerStatus` (gate on `serverControl` capability if not already) and shouldn't offer local-only actions.
- Test Connection for OpenRouter validates the API key (hit `/models` **with** the auth header and treat 401 as failure) so a bad key is caught at setup, not at first chat.

## 10. Verification

- `npm run build`, `npm run lint:fix`, `npm test` (new: openrouter mapper tests, openai-compat chat mapper tests move, test-runner external-ref test).
- Manual: add OpenRouter provider with real key → browse/filter/paginate catalog → chat with a free model (e.g. a `:free` variant) in Playground → run a small suite against one external model.

---

## Resolved decisions

1. External Models view is browse-only for now — no per-row "add to run / open in playground" actions.
2. Playground model picker: add an optional `searchable` prop to the existing `Select.vue`.
3. OpenRouter `model` and `model:free` variants are shown as independent rows.
4. Catalog is cached in-memory per session; a refetch button (Refresh in the view header, F5) bypasses the cache on demand.
5. Pricing displayed as USD per 1M tokens.
6. Shared OpenAI-compat chat lives in `src/core/providers/openai-compat/`.
7. `ExternalModelPricing` includes optional `cacheReadPerMTokens`.
8. OpenRouter chat API doc will be provided at `docs/openrouter/README.md`; `chat()` implementation waits for it.
9. Non-text-output models (e.g. image generation) are filtered out in the mapper and never reach the UI. `modality` describes *input* (`text` vs `multimodal`); output is always text.
10. Default catalog sort is newest first (`created` desc); the sort control covers name/price/context ordering.
11. Cost estimation for external test runs (tokens × pricing) is a follow-up after this plan ships.

---

## Implementation decisions (made during implementation)

1. **`reasoning: 'on'` → OpenRouter `effort: 'medium'`** (OpenRouter's documented default effort); `'off'` → `'none'`. Alternatives: sending an empty `reasoning: {}` (undocumented behavior) or mapping `'on'` to `'high'`.
2. **(Revised after review)** `chatViaOpenAI` was rejected — its `extras` hooks would grow with every provider quirk. Final architecture: `openai-compat/` is **pure types + pure mappers only, no I/O and no provider knowledge**. Each provider owns its fetch, headers, and error mapping, and extends the base interfaces in its own `types.ts` (e.g. `ChatCompletionRequest extends OpenAIChatRequest` with a typed `reasoning` field). OpenRouter's own `toChatResponse` captures the full response: `reasoning_output_tokens`, `cached_input_tokens`, `cost`, `cost_details` (added to `ChatStats` as optional fields), and a `reasoning` output item when the assistant message carries one. `openai-compat/index.ts` is dead code pending manual deletion.
3. **`custom/mappers.test.ts` was repurposed** (tests `toLocalModel`) instead of deleted — file deletion was denied by permissions; the chat-mapper tests moved to `openai-compat/mappers.test.ts` as planned. `ExternalModelCard.vue` was removed via `git rm` (deletion is staged).
4. **`cacheReadPerMTokens` is only set when non-zero**, so the expanded row hides it for models without cache pricing.
5. **Free = input and output price both 0** → "Free" badge; the price columns then show "—" instead of `$0.00`.
6. **`formatPrice`** renders `$3.00/1M`; sub-cent prices fall back to 2 significant digits (`$0.0000625/1M` → `$0.000063/1M`).
7. **"No key configured" is a non-blocking notice banner** in the External Models view; the catalog still loads (OpenRouter serves it keyless per §2). Alternative: hard-blocking the view behind key setup.
8. **Attribution headers**: `HTTP-Referer: https://github.com/BekirUzun/cannonade`, `X-Title: Cannonade`.
9. **External model picker in New Run reuses `NewRunModelSelector`** with a new `external` prop (searchable checklist; Registry/HF sections hidden; chips become `{ source: 'external', modelId }`). Alternative: a separate component — rejected as near-duplicate.
10. **Playground store's `models` became provider-agnostic** (`PlaygroundModelOption { id, name, loaded }`) instead of `LocalModel[]`; the `type === 'llm'` filter moved into the local branch of `loadModels`.
11. **Test Connection with no key configured still passes** (no auth header sent; catalog is public). A wrong key fails via the mapped 401 → "Invalid or missing OpenRouter API key".
12. **`createdAt` stays in unix seconds** (raw OpenRouter value); the row converts for display.
13. **`activeLocalProvider` now picks from `localProviders` only**, so an external provider can never become the implicit local selection.
