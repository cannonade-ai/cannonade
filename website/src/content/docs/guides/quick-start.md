---
title: Quick start
description: Install Cannonade, add a model provider, and run your first test suite.
sidebar:
  order: 1
---

Cannonade is a desktop app for building LLM test suites and running them across several AI models at once. Iterate on your prompts and validate every model output against the checks you define. There is no server to stand up, no account to create, and no API key required unless you want to test cloud models. Everything you create, including prompts, test suites, and run history, is stored as JSON files on your own machine.

## 1. Install

Download the build for your platform from the [GitHub Releases](https://github.com/cannonade-ai/cannonade/releases), then:

- **Windows**: run the `.exe` installer.
- **macOS**: see [below](#macos-needs-an-extra-step), the build is unsigned.
- **Linux**: `.AppImage`, `.deb`, and snap builds are published. Mark the AppImage
  executable and run it, or install the package that matches your distribution.

### macOS needs an extra step

The macOS build is not code-signed or notarized, so there is no working installer flow yet
and macOS refuses to launch the app until you do below steps.

1. Open the `.dmg` and copy `Cannonade.app` into `/Applications` yourself.
2. Remove the quarantine flag macOS attached to the download:

```sh
xattr -dr com.apple.quarantine /Applications/Cannonade.app
```

3. Launch Cannonade normally.

Skip the second step and macOS reports the app as damaged and offers to move it to the
trash, which is what an unsigned download looks like to Gatekeeper rather than an actual
problem with the file. You only have to do this once per install, so repeat it after
updating to a new version.

## 2. Add a provider

A provider is a source of models. On first launch Cannonade has none, so it shows a
welcome screen with **Add your first provider**. You can also add one later from
**Settings > Providers**.

The dialog has a **Test Connection** button. It is optional, so press it before adding the
provider if you want to confirm the URL and credentials first.

Once the provider is added, its models show up under **Local Models** or **External
Models**, depending on whether it runs on your hardware or in the cloud.

See [Connect a provider](/docs/guides/connect-a-provider/) for per-provider detail.

## 3. Try a model in the Playground

The Playground is the fastest way to confirm everything works. Pick a model, type a
prompt, and send it. Responses report tokens per second and time to first token, the same
stats Cannonade records during a test run.

## 4. Run the bundled suite

Cannonade ships with a suite called **Default Tests**, a handful of easy cases aimed at
small models, so you have something to run immediately.

1. Open **Test Runs** and click **New Run**.
2. Pick the suite, then pick a provider.
3. Select one or more of that provider's models.
4. Click **Run** and watch each case resolve per model.

When the run finishes, each model gets its own summary: cases passed and failed, average
score, tokens per second, time to first token, duration, and for cloud models, token usage
and cost.

## 5. Make it yours

- Add your own cases in [Build a test suite](/docs/guides/build-a-test-suite/).
- Pick the right scoring method in [Evaluators](/docs/reference/evaluators/).
- Save system prompts under **Prompts**, where each one is versioned, so suites and the
  Playground can share a single source of truth and pin a specific version.

## Where your data lives

Suites, prompts, runs, and settings are written to your OS application data directory as
plain JSON. **Settings > General** shows the suites folder and can open it for you. The
files are readable, diffable, and safe to back up or commit to a private repository.

API keys are the exception: they are either read from an environment variable you name, or
stored encrypted with the operating system's own secret storage.

Nothing is uploaded anywhere unless you configure a cloud provider, and then only the
requests that provider needs to serve.
