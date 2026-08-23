---
name: summarize-provider-docs
description: Condense a vendor's API documentation at docs/<provider-type>/ down to only what Cannonade's provider implementation needs, for either a local or an external provider. Use before add-local-provider or add-external-provider when the vendor docs are long, cover many endpoints, or offer several alternative APIs for the same job.
---

Vendor API docs are written for everyone; a Cannonade provider uses a small slice. This skill turns a long vendor doc into a short implementation brief.

Run this **before** `add-local-provider` / `add-external-provider`, not instead of them — those skills expect `docs/<provider-type>/README.md` to already answer their pre-requisite questions. The output is that same file rewritten in place, not a new file alongside it.

## Step 0 — Target and mode

Sibling files (e.g. `EXAMPLE.md` with responses captured from the user's own environment) are **left untouched** — they are ground truth. Read them anyway; they often show an endpoint behaving differently than the vendor claims, which belongs in your final report.

Determine whether the provider is **local** or **external** — it decides what must survive the cut:

| | Local (Ollama, LM Studio, llama.cpp) | External (OpenRouter, Vercel AI Gateway) |
|---|---|---|
| Runs | on the user's machine | as a cloud service |
| Must cover | chat, list models, load/unload, download + progress, delete, server control, health | chat, list models |
| API key | usually optional | required |

If the docs leave this ambiguous, ask — it drives `isExternal` in `KNOWN_PROVIDER_DEFAULTS` and cannot be quietly reversed later.

**Before overwriting**, confirm the file is committed (`git status --porcelain docs/<provider-type>/README.md`). If it is dirty or untracked, the rewrite is unrecoverable — tell the user and ask how to proceed.

## Step 1 — Read the whole doc

End to end, before deciding anything. Sections that look irrelevant by their heading sometimes carry the response field that maps to `ChatResponse.stats`, or the error shape every endpoint shares.

## Step 2 — Choose among alternative endpoints

Vendors expose the same capability several ways. Pick the one supporting the **most request and response parameters**, and report which alternatives you rejected and why:

- An OpenAI-compatible chat route usually beats a native raw-prompt route, which would make us apply chat templates ourselves — but check first that the OpenAI route still accepts the vendor's own sampling params, so nothing is lost. (llama.cpp: `/v1/chat/completions` accepts all `/completion` sampling options, so the native route was dropped.)
- Vendor-specific listing endpoints usually beat OpenAI-compatible `/v1/models`, often a stub with far less metadata.
- Prefer routes returning richer stats — token counts, timings, cached tokens — since `ChatResponse.stats` wants them.

Where the choice is close, or the richer endpoint exists only under a particular server mode or flag, keep both, mark the trade-off, and raise it in Step 5.

## Step 3 — Keep, cut, restructure

**Keep**, in enough detail to implement against: the endpoints backing this mode's capabilities; full request params with defaults and response shapes with real example JSON (these become `types.ts` and `mappers.ts`); base URL, auth method, and shared error shape; and anything constraining the implementation — required flags, operating modes, per-endpoint availability, rate limits, SSE formats, idle/sleep behavior.

Keep the vendor's own wording for parameter semantics and defaults. Rewriting these in your own words is how subtle details get lost.

**Cut** everything not reachable from a capability: unused endpoints, install and quick-start instructions, Docker recipes, web UI and config-file sections, feature lists, benchmarks, contributor notes, SDK examples in languages we do not use, and links to files outside the doc (relative paths from the vendor's repo do not resolve here).

**Restructure**, do not merely delete — deletion alone leaves facts wherever the vendor happened to put them. Hoist cross-cutting constraints to the top and tag every endpoint they affect. In the llama.cpp doc, single-model vs router mode sat in a late section while determining whether half the endpoints exist at all; hoisting it and marking each endpoint **Router mode only** was most of the value.

## Step 4 — Capability mapping table

Close the doc with the translation into Cannonade's `capabilities` object:

```markdown
| Capability | Value | Backed by |
|---|---|---|
| `chat` | ✓ | `POST /v1/chat/completions` |
| `localModels` | ✓ | `GET /models` |
| `serverControl` | ✗ | no start/stop API |
```

Give every capability a row — `chat`, `localModels`, `externalModels`, `downloadModel`, `downloadStatus`, `deleteModel`, `loadModel`, `serverControl`, `requiresApiKey` — including the false ones with a one-phrase reason. A missing capability reads as an oversight; a ✗ with a reason is a decision.

Mark ✓ only where the doc shows an endpoint that implements it. `buildRegistry` throws when a `true` capability has no matching method, so an optimistic ✓ becomes a runtime failure later.

## Step 5 — Report

Tell the user which endpoints survived and which were cut, each alternative-endpoint choice with its reason, any restructuring beyond deletion, and — most importantly — **open decisions**: anything the docs cannot settle that changes the implementation (a capability existing only in one server mode, an unclear auth flow, a field `EXAMPLE.md` contradicts). Present these as options; do not resolve them yourself.

## Checklist

- [ ] Provider identified as local or external
- [ ] `README.md` confirmed committed before overwriting;
- [ ] One endpoint chosen per capability, most-featured alternative, rejections recorded
- [ ] Request params with defaults and example response JSON kept verbatim
- [ ] Auth, base URL, and error shape kept
- [ ] Cross-cutting constraints hoisted and tagged per endpoint
- [ ] Capability table added, every capability present with a reason
- [ ] Open decisions raised to the user rather than resolved silently
