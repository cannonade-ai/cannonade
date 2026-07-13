# List Models

`GET https://openrouter.ai/api/v1/models`

Auth: `Authorization: Bearer <api key>`

Returns the list of models available on OpenRouter, with pricing, context length, and capabilities.

## Query params (all optional)

- `category` — filter by use case (e.g. `programming`, `roleplay`, `legal`, ...)
- `q` — free-text search by model name/slug
- `input_modalities` / `output_modalities` — comma-separated (`text`, `image`, `audio`, `file`, `video`, ...)
- `context` — minimum context length in tokens
- `min_price` / `max_price` — prompt price range ($/M tokens)
- `min_output_price` / `max_output_price` — completion price range ($/M tokens)
- `arch` — model family (e.g. `GPT`, `Claude`, `Gemini`, `Llama`)
- `model_authors` — comma-separated author slugs (e.g. `openai,anthropic`)
- `providers` — comma-separated hosting provider names
- `supported_parameters` — comma-separated (e.g. `temperature`)
- `sort` — `pricing-low-to-high`, `pricing-high-to-low`, `context-high-to-low`, `throughput-high-to-low`, `latency-low-to-high`, `most-popular`, `top-weekly`, `newest`, `intelligence-high-to-low`, `coding-high-to-low`, `agentic-high-to-low`

## Response

```json
{
  "data": [
    {
      "id": "openai/gpt-4",
      "canonical_slug": "openai/gpt-4",
      "name": "GPT-4",
      "created": 1692901234,
      "description": "GPT-4 is a large multimodal model...",
      "context_length": 8192,
      "architecture": {
        "modality": "text->text",
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "GPT",
        "instruct_type": "chatml"
      },
      "pricing": {
        "prompt": "0.00003",
        "completion": "0.00006",
        "request": "0",
        "image": "0"
      },
      "top_provider": {
        "context_length": 8192,
        "max_completion_tokens": 4096,
        "is_moderated": true
      },
      "supported_parameters": ["temperature", "top_p", "max_tokens"],
      "reasoning": {
        "mandatory": false,
        "default_enabled": true,
        "default_effort": "medium",
        "supported_efforts": ["high", "medium", "low", "minimal"]
      },
      "per_request_limits": null,
      "default_parameters": null,
      "supported_voices": null,
      "links": { "details": "/api/v1/models/openai/gpt-4/endpoints" }
    }
  ]
}
```

### Fields worth knowing

- `pricing.*` — USD per token (or per request/image), as strings. `0` means free/unused.
- `context_length` — max context in tokens; nullable.
- `architecture.input_modalities` / `output_modalities` — `text`, `image`, `audio`, `file`, `video`, `embeddings`, `rerank`, `speech`, `transcription`.
- `reasoning` — present only for reasoning-capable models; `mandatory: true` means effort can't be set to `none`.
- `benchmarks` (optional, when available) — `artificial_analysis` (`intelligence_index`, `coding_index`, `agentic_index`) and `design_arena` (ELO per arena/category).


# Get a Model by Slug

`GET https://openrouter.ai/api/v1/model/{author}/{slug}`

Auth: `Authorization: Bearer <api key>`

Returns full details for a single model, e.g. `openai/gpt-4`. Supports variant suffixes (e.g. `openai/gpt-4:free`) and resolves known slug aliases.

Path params: `author` (e.g. `openai`), `slug` (e.g. `gpt-4` or `gpt-4:free`).

Response shape is the same `Model` object described above, wrapped in `{ "data": {...} }` (not an array). Returns `404` if the model doesn't exist.

