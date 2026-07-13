# OpenRouter Chat Completions

Scope: text-only chat, no tools/function-calling, no images, no plugins/MCP. Reference for implementing `chat()` in `src/core/providers/openrouter/`.

## Endpoint

```
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer <api-key>
Content-Type: application/json
```

OpenAI-compatible. Supports streaming (SSE) and non-streaming modes.

## Request body

```json
{
  "model": "openai/gpt-4",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What is the capital of France?" }
  ],
  "temperature": 0.7,
  "max_tokens": 150,
  "stream": false
}
```

Relevant fields:

| Field | Type | Notes |
|---|---|---|
| `model` | string | required. e.g. `openai/gpt-4` |
| `messages` | array | required, min 1. See message roles below |
| `temperature` | number \| null | 0–2 |
| `max_tokens` | integer \| null | deprecated in favor of `max_completion_tokens`; some providers enforce a minimum of 16 |
| `max_completion_tokens` | integer \| null | preferred over `max_tokens` |
| `top_p` | number \| null | 0–1 |
| `stop` | string \| string[] \| null | up to 4 sequences |
| `seed` | integer \| null | for deterministic output |
| `stream` | boolean | default `false` |
| `reasoning` | object \| null | `{ effort?: 'max'\|'xhigh'\|'high'\|'medium'\|'low'\|'minimal'\|'none', summary?: 'auto'\|'concise'\|'detailed' }` — for reasoning models |
| `reasoning_effort` | string \| null | shorthand for `reasoning.effort`; cannot conflict with `reasoning.effort` if both set |
| `user` | string | unique end-user identifier |

### Message roles

- **system**: `{ role: "system", content: string, name?: string }`
- **user**: `{ role: "user", content: string, name?: string }`
- **assistant**: `{ role: "assistant", content: string | null, name?: string, refusal?: string | null, reasoning?: string | null }`
- **developer**: `{ role: "developer", content: string, name?: string }` — rarely needed

`content` can also be an array of content parts for multimodal input, but Cannonade only sends plain strings.

## Non-streaming response

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "openai/gpt-4",
  "choices": [
    {
      "index": 0,
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris."
      }
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 10,
    "total_tokens": 35,
    "cost": 0.0012,
    "cost_details": {
      "upstream_inference_prompt_cost": 0.0008,
      "upstream_inference_completions_cost": 0.0004
    },
    "prompt_tokens_details": { "cached_tokens": 2 },
    "completion_tokens_details": { "reasoning_tokens": 5 }
  }
}
```

`finish_reason`: `"stop" | "length" | "content_filter" | "error" | "tool_calls" | null` (Cannonade only cares about `stop`/`length`/`error`).

## Streaming response (SSE)

Each event's `data:` payload is a JSON chunk; the stream ends with `data: [DONE]`.

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"openai/gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

data: [DONE]
```

- `choices[].delta` — partial message (`role`, `content`), accumulate across chunks.
- `usage` — included in the final chunk (full totals, not deltas).
- A chunk may carry an `error` object (`{ code, message, metadata: { error_type } }`) instead of failing the HTTP request — check for it while consuming the stream.

## Errors

Non-2xx responses share this shape:

```json
{ "error": { "code": 401, "message": "Missing Authentication header" } }
```

| Status | Meaning |
|---|---|
| 400 | Invalid request parameters |
| 401 | Missing/invalid API key |
| 402 | Insufficient credits |
| 403 | Insufficient permissions or guardrail-blocked |
| 404 | Resource not found |
| 408 | Request timed out |
| 413 | Payload too large |
| 422 | Semantic validation failure |
| 429 | Rate limited |
| 500 | Internal server error |
| 502 | Provider/upstream failure |
| 503 | Service temporarily unavailable |
| 524 | Infrastructure timeout |
| 529 | Provider overloaded |

Map at minimum: `401` → invalid/missing key, `402` → insufficient credits, `429` → rate limited (per `OPENROUTER_PLAN.md`).
