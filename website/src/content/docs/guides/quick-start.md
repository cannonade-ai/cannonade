---
title: Quick start
description: Install Cannonade, connect a model provider, and run your first test suite.
sidebar:
  order: 1
---

Cannonade is a desktop app. There is no server to stand up, no account to create, and no
API key required unless you want to test cloud models. Everything you create — prompts,
test suites, and run history — is stored as JSON files on your own machine.

## 1. Install

Download the build for your platform from the [downloads page](/#download), then:

- **Windows** — run the `.exe` installer.
- **macOS** — open the `.dmg` and drag Cannonade to Applications.
- **Linux** — mark the `.AppImage` executable and run it.

Cannonade checks for updates on launch and installs them in the background.

## 2. Connect a provider

On first launch, Cannonade has no models to talk to. Open **Settings → Providers** and add
one:

| If you have…                       | Add this provider                            |
| ---------------------------------- | -------------------------------------------- |
| Ollama running locally             | **Ollama** — defaults to `http://localhost:11434` |
| LM Studio running locally          | **LM Studio** — defaults to `http://localhost:1234` |
| An OpenRouter key                  | **OpenRouter** — paste the key                |
| Anything else OpenAI-compatible    | **Custom** — enter the base URL              |

Cannonade tests the connection when you save. Once it succeeds, the provider's models
appear under **Models**.

See [Connect a provider](/docs/guides/connect-a-provider/) for per-provider detail.

## 3. Try a model in the Playground

The Playground is the fastest way to confirm everything works. Pick a model, type a
prompt, and send it. Alongside the response you get token counts, time to first token,
and tokens per second — the same stats Cannonade records during a test run.

## 4. Run the starter suite

Cannonade ships with a starter test suite so you have something to run immediately.

1. Open **Test suites** and select the starter suite.
2. Click **Run**, then select one or more models. Selecting several is the point — they
   all run against the same cases.
3. Watch results stream in per case, per model.

When the run finishes you get a comparison table: pass rate, mean score per evaluator,
and timing for every model you selected.

## 5. Make it yours

- Add your own cases in [Build a test suite](/docs/guides/build-a-test-suite/).
- Pick the right scoring method in [Evaluators](/docs/reference/evaluators/).
- Save reusable system prompts in the **Prompt library** so suites and the Playground
  share one source of truth.

## Where your data lives

Suites, prompts, and runs are written to your OS application data directory as plain
JSON. They are readable, diffable, and safe to back up or commit to a private repo.
Nothing is uploaded anywhere unless you configure a cloud provider, and then only the
requests that provider needs to serve.
