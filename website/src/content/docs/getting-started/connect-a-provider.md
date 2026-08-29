---
title: Connect a provider
description: Add local and cloud model providers to Cannonade and verify the connection.
sidebar:
  order: 2
---

A provider is a source of models. Cannonade can have as many configured as you like, local
and cloud side by side, and you choose which one a test run targets.

Providers are managed in **Settings > Providers**. Each entry stores a display name, a base
URL, and how credentials are resolved.

## Credentials

Every provider entry picks one of three auth methods:

- **None**: no credentials sent. The usual choice for a local server.
- **Environment variable**: Cannonade reads the key from a variable you name, such as
  `OPENROUTER_API_KEY`. The key never enters Cannonade's own files.
- **Stored key**: you paste the key and Cannonade encrypts it with the operating system's
  secret storage before writing it to disk.

## Local providers

Local providers run models on your own hardware. Cannonade talks to them over HTTP, so the
server can be on this machine or another one on your network. Mark the entry as remote if
the server is not local, which disables the actions that only make sense on the machine
running the server.

### Ollama

1. Install and start Ollama.
2. Add the **Ollama** provider. The default base URL is `http://localhost:11434`.
3. Pull at least one model, either with `ollama pull` (i.e: `ollama pull gemma3:270m`).

From Local Models you can load, unload, and delete Ollama models without leaving the app.

:::note
Experimental: If Ollama is started outside of Cannonade, server management won't be available. Cannonade only stops Ollama server processes it started itself.
:::

### LM Studio

1. Start LM Studio and enable its local server.
2. Add the **LM Studio** provider. The default base URL is `http://localhost:1234`.

Cannonade uses LM Studio's native API where it can, which is what gives you the full token
and timing statistics on single-turn requests. Deleting models is only offered when the
server is local, since it removes files on the server's own disk.

### llama.cpp

1. Start `llama-server`, or let Cannonade start it from the provider card.
2. Add the **llama.cpp** provider. The default base URL is `http://localhost:8080`.

Model management needs llama-server running in router mode. If the server was started to
serve a single model, Cannonade can still chat with it and run suites against it, but the
model management actions are unavailable.

:::note
EXPERIMENTAL: If llama-server is started outside of Cannonade, server management won't be available. Cannonade only stops llama-server processes it started itself.
:::

## Cloud providers

### OpenRouter

Add the **OpenRouter** provider and give it your API key. Cannonade fetches the model
catalogue, including context length, modalities, and per-token pricing.

### Vercel AI Gateway

Add the **Vercel** provider and give it your API key. Like OpenRouter, it exposes a large
catalogue of hosted models through one endpoint.

### Custom (OpenAI-compatible)

Any endpoint that speaks the OpenAI chat completions API works here: vLLM, a gateway, or a
provider not yet supported natively. Supply the base URL and, if the endpoint requires one,
a key. A custom provider can list models and chat; it cannot download, load, or delete
them, since those actions have no equivalent in the OpenAI-compatible surface.

## Verifying a connection

The add and edit provider dialog has a **Test Connection** button. If it fails:

- **Connection refused**: the server is not running, or the port is wrong.
- **401 or 403**: the key is missing, wrong, or lacks access.

A quick end-to-end check: open the **Playground**, pick a model from the new provider, and
send a one-line prompt. If you get a response with stats, the provider is ready for test
runs.

## Working with several providers

Adding Ollama, LM Studio, and OpenRouter together is fine, and so is adding two entries of
the same type pointed at different machines.

A single test run targets one provider and any number of that provider's models. To compare
across providers, run the same suite once per provider. The runs are saved side by side in
**Test Runs**, with the same cases and the same scoring, so a small local model and a
frontier cloud model stay directly comparable.
