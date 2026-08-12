---
title: Providers
description: Supported model providers, their defaults, and what each one gives you.
sidebar:
  order: 2
---

## Supported providers

| Provider       | Kind  | Default endpoint         | Credentials |
| -------------- | ----- | ------------------------ | ----------- |
| **Ollama**     | Local | `http://localhost:11434` | None        |
| **LM Studio**  | Local | `http://localhost:1234`  | None        |
| **OpenRouter** | Cloud | Hosted                   | API key     |
| **Custom**     | Either| You supply it            | Optional    |

Local providers accept a remote address too — point Cannonade at a workstation on your
network and it will treat that machine's models as if they were local.

## What each provider supports

| Capability                 | Ollama | LM Studio | OpenRouter | Custom |
| -------------------------- | :----: | :-------: | :--------: | :----: |
| List models                | ✓      | ✓         | ✓          | ✓      |
| Chat / Playground          | ✓      | ✓         | ✓          | ✓      |
| Token and timing stats     | ✓      | ✓         | partial    | partial|
| Load / unload models        | ✓      | ✓         | —          | —      |
| Delete models              | ✓      | ✓         | —          | —      |
| Download models            | ✓      | ✓         | —          | —      |
| Pricing and context length | —      | —         | ✓          | —      |

Stats coverage on cloud and custom endpoints depends on what the endpoint reports.
Cannonade shows what it receives and leaves the rest blank rather than estimating.

## Model downloads

For local providers, Cannonade can pull models from the provider's own registry or
directly from Hugging Face, with progress reported in the app. Downloads land wherever
the provider stores its models; Cannonade does not keep a second copy.

## Managed server processes

Cannonade can start a local server itself when one is not already running, and shuts it
down when you are done.

The rule it follows: **it only stops what it started.** A server process Cannonade
launched headlessly is its to reap. An application you started yourself — LM Studio with
its window open and its tray icon showing — is left running when Cannonade exits.

## Adding a provider that is not listed

Two options, in order of effort:

1. **Use the Custom provider.** If the endpoint speaks the OpenAI chat completions API,
   this works today and needs no code.
2. **Contribute a native provider.** Native providers get accurate stats, model
   management, and provider-specific features that the OpenAI-compatible shape cannot
   express. The provider layer is deliberately small: a factory, a set of mappers, and a
   registration entry. See [CONTRIBUTING](https://github.com/BekirUzun/cannonade) in the
   repository.

More native providers are in progress.
