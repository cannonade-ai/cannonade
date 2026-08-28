---
title: Documentation
description: Guides and reference for Cannonade, the local-first desktop app for testing and comparing LLMs.
---

Cannonade is a cross-platform desktop app for building test suites, running them against
several models, and comparing the results. There is no eval harness to write and nothing
is sent to a third party unless you configure a cloud provider yourself.

## Getting started

Start here if you are new.

- [Quick start](/docs/getting-started/quick-start/): install the app, add a provider, run
  the bundled suite.
- [Connect a provider](/docs/getting-started/connect-a-provider/): Ollama, LM Studio,
  llama.cpp, OpenRouter, Vercel AI Gateway, and any OpenAI-compatible endpoint.

## Guides

- [Build a test suite](/docs/guides/build-a-test-suite/): write cases, attach evaluators,
  and iterate on a prompt.
- [Understand your results](/docs/guides/understand-your-results/): how scoring works, and
  how to read the numbers a run reports.
- [Prompts and versioning](/docs/guides/prompts-and-versioning/): reuse a system prompt
  across cases, and pin one to a version.

## Reference

Look things up here.

- [Evaluators](/docs/reference/evaluators/): every scoring method and when to use it.
- [Providers](/docs/reference/providers/): supported providers, their defaults, and what
  each one can do.
- [Files and folders](/docs/reference/files-and-folders/): where Cannonade keeps your
  suites, runs, prompts, and settings on disk.
- [Settings](/docs/reference/settings/): what each pane controls, and the choices with
  consequences.
- [Experiments](/docs/reference/experiments/): opt-in features that are not settled yet.

## Something missing?

These docs live in the same repository as the app, and every page has an "Edit this page"
link at the bottom. Corrections and gaps are welcome as pull requests or 
[issues](https://github.com/cannonade-ai/cannonade/issues).
