# Playground View — Implementation Plan

A new top-level view for chatting with any configured provider/model: quick prompt testing, prompt engineering, and providers that have no built-in chat UI. Supports multi-turn conversations via client-side message history (no `previous_response_id` — full history is resent each turn, works identically across all providers).

## Current state (what exists today)

- `LLMProvider.chat(request, options)` is implemented by all providers (`ollama`, `lmstudio`, `openrouter`, `custom`) but is only called from the main-process test runner (`src/main/services/test-runner/chat-handler.ts`). There is **no renderer→main chat IPC**; the `PROVIDER.CHAT` constant (`src/shared/provider/ipc-channels.ts:4`) is defined but unused.
- `ChatRequest` (`src/shared/provider/chat.ts`) is single-shot: `input: string | InputItem[]` + `system_prompt`. Every provider mapper internally builds an OpenAI-style `messages[]` array from it.
- `ChatMessage` (`role: 'system' | 'user' | 'assistant'`, `content: string`) already exists in `src/shared/app/test-suite.ts:51`.
- The test-runner mapper (`src/main/services/test-runner/mappers.ts:27-35`) currently **flattens** multi-turn test case messages into one user string — a known limitation this plan fixes as a side effect.
- Abort pattern precedent: `run-handlers.ts` keeps a `Map<string, AbortController>` keyed by id, with separate START/ABORT channels.
- Capability gating precedent: `ProviderCapabilities.chat` already exists and is validated by the registry.

## Phase 1 — Shared types: conversation support in `ChatRequest`

**`src/shared/provider/chat.ts`**
- Move `ChatMessage` here from `@shared/app/test-suite` and update all existing imports in one pass (no re-export shim).
- Add to `ChatRequest`: `messages?: ChatMessage[]`.
- Semantics: when `messages` is present, it is the full conversation and takes precedence over `input`/`system_prompt`. When absent, existing behavior is unchanged.

**Provider mappers** (one small change each):
- `src/core/providers/custom/mappers.ts` → `toChatMessages()`: if `request.messages?.length`, return them directly (prepending `system_prompt` as a system message only if no system message exists in the array).
- `src/core/providers/ollama/mappers.ts`: same pass-through logic.
- `src/core/providers/lmstudio/…` (decided): LM Studio's native `/api/v1/chat` does not accept client-side message history, so when `messages` represents a real multi-turn conversation the provider falls back to LM Studio's OpenAI-compatible `/v1/chat/completions` endpoint (reusing the custom provider mappers). Single-turn requests — including chat-type test cases with just system + one user message — keep the native endpoint so tok/s and TTFT stats are preserved.
- `src/core/providers/openrouter/…`: no change — it has `capabilities.chat: false` and implements no `chat()`.

**Test runner** (decided fix): `src/main/services/test-runner/mappers.ts` — replace the lossy flatten with `messages` pass-through so multi-turn test cases reach the model as real turns. Update `index.test.ts` expectations accordingly. Note: this is an intentional behavior change — existing multi-turn test suites will send real turns instead of a joined blob, so results may shift.

## Phase 2 — Chat IPC channel

Follow the 5-file IPC pattern (`add-ipc-channel` skill):

1. **Channel constants** — `src/shared/provider/ipc-channels.ts`: `CHAT` already exists; add `CHAT_ABORT: 'provider:chatAbort'`.
2. **Main handler** — `src/main/ipc/handlers.ts` (or a new `chat-handlers.ts` alongside the other `*-handlers.ts` files, registered in the same place):
   ```ts
   const chatAborts = new Map<string, AbortController>()
   ipcMain.handle(PROVIDER.CHAT, async (_e, providerId: string, requestId: string, request: ChatRequest) => {
     const provider = getProvider(providerId)  // registry
     const controller = new AbortController()
     chatAborts.set(requestId, controller)
     try {
       return await provider.chat!(request, { abortSignal: controller.signal })
     } finally {
       chatAborts.delete(requestId)
     }
   })
   ipcMain.handle(PROVIDER.CHAT_ABORT, (_e, requestId: string) => {
     chatAborts.get(requestId)?.abort()
   })
   ```
   Guard: throw a clear error if `!provider.chat` / `!capabilities.chat`. Use `createLogger('chat-handler')`.
3. **Preload bridge** — `src/preload/index.ts`: `chat(providerId, requestId, request)` / `abortChat(requestId)`.
4. **Type declaration** — `src/preload/index.d.ts`.
5. **Renderer API wrapper** — `src/renderer/src/api/index.ts`.

No streaming (decided) — `chat()` has no streaming interface; the response arrives whole. The playground shows a "generating…" indicator with a working Stop button. `invoke`-based IPC is fine since streaming is out of scope.

## Phase 3 — Navigation

- `src/renderer/src/stores/navigation.ts`: add `'playground'` to the `View` union.
- `src/renderer/src/components/AppSidebar.vue`: add nav item labeled "Playground", icon `IconMessageCircle` (tabler), placed after Prompts.
- `src/renderer/src/views/index.ts` + `App.vue` switch: register `PlaygroundView`.

## Phase 4 — Playground store

**`src/renderer/src/stores/playground.ts`** (`createLogger('playground-store')`):

State:
- `providerId: string`, `modelId: string` — the playground manages its own provider selection, independent of `activeLocalProvider`; any configured provider with `capabilities.chat` is selectable (initial default: the app's default provider)
- `systemPrompt: string`
- `messages: ChatMessage[]` (user/assistant turns only; system prompt kept separate and prepended at send time)
- `params` — `temperature`, `top_p`, `top_k`, `min_p`, `repeat_penalty`, `frequency_penalty`, `presence_penalty`, `seed`, `max_output_tokens`, `reasoning` (all optional, mirroring `ChatRequest`)
- `sending: boolean`, `currentRequestId: string | null`
- `lastStats: ChatStats | null`, per-assistant-message stats + reasoning output kept alongside the message (see UI model below)
- `linkedPrompt: { promptId: string; version: PromptVersionRef } | null` — when a saved prompt is loaded as system prompt

Internal UI message model (richer than `ChatMessage`, converted down when building the request):

```ts
interface PlaygroundMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  stats?: ChatStats
  error?: string
}
```

Actions:
- `send(userText)` — push user message, build `ChatRequest` (`messages` = system + history, plus params), `requestId = crypto.randomUUID()`, call `api.chat(...)`; on success extract `message` items → assistant content, `reasoning` items → reasoning, attach stats; on error attach `error` to a failed assistant placeholder (retryable) and toast via `toast` store.
- `abort()` — `api.abortChat(currentRequestId)`.
- `retryLast()` — resend after an error without duplicating the user turn.
- `clear()` — new conversation (keeps model/params/system prompt).
- `loadPrompt(promptId, version)` — resolve content via `usePromptsStore` (`getPromptVersion`), set as `systemPrompt`, set `linkedPrompt`. Editing the loaded text manually detaches the link (marks it "modified").

Out of scope for v1 (decided): transcript editing (edit-and-resend, regenerate, delete turns) and conversation persistence. Conversations live in Pinia only — they survive view switches but are lost on app restart.

## Phase 5 — View & components

**`src/renderer/src/views/PlaygroundView.vue`** — layout with `SplitPane`: main chat column + right sidebar (settings). Reuse `ui/` components throughout (`Select`, `Textarea`, `NumberInput`, `Button`, `Field`, `ScrollArea`, `CopyButton`, `Panel`, `InfoTooltip`, `Badge`, `Toggle`).

New components in `src/renderer/src/components/playground/`:

| Component | Responsibility |
|---|---|
| `PlaygroundMessageList.vue` | Scrollable transcript (`ScrollArea`), auto-scroll on new message, empty state |
| `PlaygroundMessage.vue` | One turn (text-only in v1): role badge, content, collapsible reasoning block, `CopyButton`, per-message stats line (tokens, tok/s, TTFT) for assistant turns, error state with retry |
| `PlaygroundComposer.vue` | `Textarea` + Send/Stop button; Enter to send, Shift+Enter for newline (via `useShortcut`); disabled while `sending` |
| `PlaygroundSettingsPanel.vue` | Right sidebar: provider `Select` and model `Select` side by side in the same row (providers filtered to `capabilities.chat`; models via `api.fetchLocalModels` / external models for openrouter-type), system prompt section, sampling params |
| `PlaygroundSystemPrompt.vue` | System prompt `Textarea` + "Load saved prompt" (prompt `Select` + version `Select` from prompts store, defaulting to latest) + linked/modified indicator |

Sampling params UI: mirror `TestSuiteRunConfigPanel.vue` (same `Field` + `NumberInput` + hint pattern and min/max/step values) — copy the field definitions, don't reuse the component (it binds to `RunConfig`, camelCase, different type).

Behavior details:
- Non-persistence is stated in the UI: an `InfoTooltip` ("i" icon) next to the conversation header / clear button — "Conversations are not saved and will be lost when the app closes."
- Model list loads when provider changes; show connection error state like `models.ts` does.
- Changing model/params/system prompt mid-conversation is allowed and applies from the next send (stateless requests make this free); show a subtle indicator on the divider when the model changed mid-conversation.
- Long conversations: no truncation logic in v1; surface provider errors (context overflow) as the message error state.

## Phase 6 — Prompt integration

**Must-have:** "Load saved prompt" in `PlaygroundSystemPrompt.vue` (Phase 5) — pick prompt + version, content fills the system prompt, link indicator shown.

**Nice-to-have:** "Open in playground" from `PromptsView` — context-menu / button on a prompt that calls a new navigation-store method `openInPlayground(promptId, version)` (mirrors the existing `openTestSuite` / `consumePendingSuiteId` pending-id pattern), navigates to playground, and the view consumes the pending ref via `playgroundStore.loadPrompt`.

## Testing & verification

- Unit tests: provider mapper `messages` pass-through (per provider, incl. system-prompt merge rules); test-runner mapper change (update `index.test.ts`).
- `npm run build` (never bare type-check), `npm run lint:fix`, `npm test`.
- Manual: run app, chat against Ollama + one OpenAI-compatible provider; verify abort mid-generation; verify multi-turn context is respected (ask a follow-up referencing earlier turn); verify prompt loading and version selection.

## Suggested implementation order

1. Phase 1 (types + mappers + tests) — foundation, independently verifiable via `npm test`.
2. Phase 2 (IPC) — verifiable from devtools console.
3. Phase 3 + 4 (nav + store).
4. Phase 5 (UI).
5. Phase 6 (prompt integration, then the nice-to-have if time allows).

---

## Decided scope summary

- `ChatMessage` moves to `src/shared/provider/chat.ts`; all imports updated in one pass (no re-export shim).
- Test-runner flattening is fixed in this branch (intentional behavior change for multi-turn test cases).
- No streaming in v1; `invoke`-based IPC.
- No conversation persistence; in-memory only, stated in the UI via an `InfoTooltip`.
- No transcript editing (edit/regenerate/delete turns); only retry-on-error and clear.
- Playground manages its own provider selection; provider + model `Select`s in the same row.
- Sidebar: "Playground" label, `IconMessageCircle`, after Prompts.
- Text-only messages in v1; widening `ChatMessage.content` to `string | InputItem[]` is the forward-compatible path for images later.
- LM Studio multi-turn requests use its OpenAI-compatible endpoint (full history, token-count-only stats); single-turn requests keep the native `/api/v1/chat` endpoint with full stats.


## Implementation Status

The Playground feature is fully implemented — all 6 phases done, with 167 tests passing, lint clean, and a full npm run build (typecheck included) green.

One decision came up mid-implementation: LM Studio's native /api/v1/chat turned out not to accept client-side message history (only role-less input items + previous_response_id), and OpenRouter has no chat() at all. Per your answer, LM Studio now falls back to its OpenAI-compatible /v1/chat/completions for real multi-turn conversations, while single-turn requests (system + one user message — i.e. every existing chat test case) keep the native endpoint so test runs retain full tok/s and TTFT stats. The plan file's scope summary was updated to record this.

What was built:

Shared types — ChatMessage moved to chat.ts, messages?: ChatMessage[] added to ChatRequest (input is now optional), all importers updated with no re-export shim.
Providers — pass-through in custom and ollama mappers (system prompt prepended only when the array has no system message); LM Studio routing via toSingleTurnRequest in lmstudio/mappers.ts. New mapper unit tests for all three.
Test runner — the lossy flatten in mappers.ts is replaced with messages pass-through (the decided behavior change); the two affected tests now assert real turns.
IPC — chat-handlers.ts with provider:chat / provider:chatAbort and an AbortController map, wired through preload, index.d.ts, and the renderer API.
Store — playground.ts: own provider/model selection filtered to chat-capable providers, message history, sampling params, send/abort/retryLast/clear/loadPrompt, linked-prompt modified tracking.
UI — PlaygroundView.vue (SplitPane, non-persistence InfoTooltip, clear button) plus five components under components/playground/: message list with auto-scroll, message bubbles with collapsible reasoning + per-message stats + retry-on-error, composer (Enter sends, Shift+Enter newline, Stop while generating), settings panel with provider+model selects in one row and the same param fields as the run config panel, and the system prompt section with saved-prompt + version pickers.
Prompt integration — loading a saved prompt with version selection (must-have) plus an "Open in Playground" context-menu item in PromptsView using a new pending-id pattern in the navigation store (nice-to-have).
What's left is the manual verification that needs live providers: chatting against Ollama and an OpenAI-compatible server, aborting mid-generation, confirming multi-turn context is respected, and prompt loading — worth a pass in npm run dev when you have LM Studio/Ollama running.