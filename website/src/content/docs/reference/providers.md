---
title: Providers
description: Supported model providers, their defaults, and what each one gives you.
sidebar:
  order: 2
---

## Supported providers

| Provider       | Kind  | Default endpoint            | Credentials |
| -------------- | ----- | --------------------------- | ----------- |
| [**Ollama**](https://github.com/ollama/ollama)     | Local | `http://localhost:11434`    | Optional    |
| [**LM Studio**](https://github.com/lmstudio-ai)  | Local | `http://localhost:1234`     | Optional    |
| [**llama.cpp**](https://github.com/ggml-org/llama.cpp)  | Local | `http://localhost:8080`     | Optional    |
| **Custom**     | Local | `http://localhost:8080`     | Optional    |
| [**OpenRouter**](https://openrouter.ai) | Cloud | `https://openrouter.ai/api/v1` | API key  |
| [**Vercel**](https://vercel.com/ai-gateway)     | Cloud | `https://ai-gateway.vercel.sh` | API key  |

Ollama, LM Studio, and llama.cpp accept a remote address too. Point Cannonade at another
machine on your network and mark the entry as remote, and its models behave like local ones
apart from the actions that have to run on the server's own machine.

You can configure the same provider type more than once, so two Ollama hosts can sit side by
side. OpenRouter and Vercel are limited to one entry each.

## What each provider supports

| Capability                 | Ollama | LM Studio | llama.cpp | Custom | OpenRouter | Vercel |
| -------------------------- | :----: | :-------: | :-------: | :----: | :--------: | :----: |
| List models                | yes    | yes       | yes       | yes    | yes        | yes    |
| Chat and Playground        | yes    | yes       | yes       | yes    | yes        | yes    |
| Token and timing stats     | yes    | yes       | yes       | partial| partial    | partial|
| Load and unload models     | yes    | yes       | yes       | no     | no         | no     |
| Download models            | yes    | yes       | yes       | no     | no         | no     |
| Delete models              | yes    | local only| yes       | no     | no         | no     |
| Start and stop the server  | local, opt-in | local only | local, opt-in | no | no  | no     |
| Pricing and context length | no     | no        | no        | no     | yes        | yes    |

Stats coverage on cloud and OpenAI-compatible endpoints depends on what the endpoint
reports. Cannonade shows what it receives and leaves the rest blank rather than estimating.

For llama.cpp, model management needs llama-server running in router mode. A server started
to hold a single model still handles chat and test runs.

The server controls marked opt-in are experimental and hidden until you enable them. See
[Managed server processes](#managed-server-processes).

## Model downloads

For local providers, Cannonade can pull models from the provider's own registry or directly
from Hugging Face, with progress reported in the app. llama.cpp is Hugging Face only.
Downloads land wherever the provider stores its models; Cannonade does not keep a second
copy.

You can also name a model that is not installed yet when starting a test run. Cannonade
downloads it first, and a run option removes it again afterwards.

## Managed server processes

For local providers, the provider card in **Settings > Providers** shows server status and
gives you start and stop buttons.

Where a server can start and stop itself, the controls are there for any local entry and
Cannonade simply asks it to.

The rest offer no way to shut themselves down. The only way to stop one is to end its
process, which is why those controls are hidden behind an experiment. The capability table
above marks which is which.

### Cannonade-managed servers (experimental)

Turn on **Cannonade-managed servers** in **Settings > Experiments** to get the controls for
those providers. It only stops what it started, and stopping ends the process outright. See
[Experiments](/docs/reference/experiments/).

## Credentials

A provider entry resolves its key one of three ways: none, an environment variable you name,
or a key you paste, which is encrypted with the operating system's secret storage before it
is written to disk. Local providers default to none, cloud providers require a key.

## Adding a provider that is not listed

Two options, in order of effort:

1. **Use the Custom provider.** If the endpoint speaks the OpenAI chat completions API, this
   works today and needs no code.
2. **Contribute a native provider.** Native providers get accurate stats, model management,
   and provider-specific features that the OpenAI-compatible shape cannot express. The
   provider layer is deliberately small: a factory, a set of mappers, and a registration
   entry. Start from the
   [repository](https://github.com/cannonade-ai/cannonade).

More native providers are in progress.
