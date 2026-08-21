# Cannonade

<p align="center">
  <a href="https://cannonade.app">
    <img src="https://raw.githubusercontent.com/cannonade-ai/cannonade/main/resources/icon.png" alt="cannonade" width="200"/>
  </a>
</p>
<p align="center"><a href="https://cannonade.app">cannonade.app</a> - <a href="https://cannonade.app/docs">Docs</a></p>

Cannonade is a cross-platform local-first desktop app for building test suites, running them against
multiple models at once, and comparing the results without writing an eval
harness or shipping your prompts to a third-party service.

<p align="center">
  <img src="https://raw.githubusercontent.com/cannonade-ai/cannonade/main/test-run.png" alt="Cannonade test run" width="900"/>
</p>

## Features

- **Local models:** view, load, unload, and delete the local models of your configured LLM providers.
- **External models:** view cloud model details and pricing from your configured LLM providers.
- **Playground:** chat with any configured model, tweak sampling parameters, and inspect
  token and timing stats.
- **Prompt library:** keep system prompts in one place and reuse them across the
  playground and test suites.
- **Test suites:** define test cases and configure evaluators once, then run them against any number of local or cloud models.
- **Test runs:** every run is saved locally with results, scores, and stats for each case.
- **Model downloads:** download models from the model registry of a configured provider or from huggingface.
- **Local first:** prompts, test suites, and test runs are all stored locally in JSON files.

## Supported providers

| Provider   | Notes                                    |
| ---------- | ---------------------------------------- |
| LM Studio  | Local or remote LM Studio server         |
| Ollama     | Local or remote Ollama server            |
| llama.cpp  | Local or remote llama-server instance    |
| Custom     | Any OpenAI-compatible local API endpoint |
| OpenRouter | Access hundreds of models via OpenRouter |
| Vercel     | Access hundreds of models via AI Gateway |
| More       | More supported providers are coming soon |

## Development

Built with Electron, Vue 3, TypeScript, Vite, Pinia, and Sass.

```bash
npm ci
npm run dev
```

### Checks

```bash
npm run validate # typecheck + build + lint:fix + tests
npm run build
npm test
npm run lint:fix
```

### Packaging

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## Contributing

Bug reports and feature requests: [GitHub Issues](https://github.com/cannonade-ai/cannonade/issues).
