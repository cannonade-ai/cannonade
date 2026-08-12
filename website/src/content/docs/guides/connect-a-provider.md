---
title: Connect a provider
description: Add local and cloud model providers to Cannonade and verify the connection.
sidebar:
  order: 2
---

A provider is a source of models. Cannonade can talk to several at once, and a single
test run can mix local and cloud models freely — that comparison is usually the reason
to run one.

Providers are configured in **Settings → Providers**. Each entry stores a name, a base
URL or API key, and nothing else.

## Local providers

Local providers run models on your own hardware. Cannonade connects over HTTP, so the
server can be on this machine or another one on your network.

### Ollama

1. Install and start Ollama.
2. Add the **Ollama** provider. The default base URL is `http://localhost:11434`.
3. Pull at least one model, either with `ollama pull` or from Cannonade's **Models**
   view.

From the Models view you can load, unload, and delete Ollama models without leaving the
app.

### LM Studio

1. Start LM Studio and enable its local server.
2. Add the **LM Studio** provider. The default base URL is `http://localhost:1234`.

Cannonade uses LM Studio's native API where it can, which is what gives you the full
token and timing statistics on single-turn requests.

:::note
If LM Studio is already running with a window open, Cannonade uses it as-is and leaves it
alone. Cannonade only stops server processes it started itself.
:::

## Cloud providers

### OpenRouter

Add the **OpenRouter** provider and paste your API key. Cannonade fetches the model
catalogue, including context length and per-token pricing, so you can see the cost of a
model before you fire a suite at it.

### Custom (OpenAI-compatible)

Any endpoint that speaks the OpenAI chat completions API works here: vLLM, llama.cpp's
server, a gateway, or a hosted provider not yet supported natively. Supply the base URL
and, if the endpoint requires one, an API key.

## Verifying a connection

Cannonade checks the connection when you save a provider. If it fails:

- **Connection refused** — the server is not running, or the port is wrong.
- **Empty model list** — the server is reachable but has no models installed.
- **401 / 403** — the API key is missing, wrong, or lacks access to the model.

A quick end-to-end check: open the **Playground**, pick a model from the new provider,
and send a one-line prompt. If you get a response with stats, the provider is ready for
test runs.

## Using several providers at once

Nothing stops you from adding Ollama, LM Studio, and OpenRouter together. When you start
a run, models from every configured provider appear in one list and you select across
them. The results table puts a 3B local model and a frontier cloud model side by side on
the same cases and the same scoring.
