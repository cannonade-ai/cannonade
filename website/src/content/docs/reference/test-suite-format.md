---
title: Test suite format
description: How a suite file is laid out and behaves, for generating and reviewing suites outside the app.
sidebar:
  order: 6
---

Each suite is one JSON file in `~/.cannonade/suites`, named `<id>.json`. The filename must
match the `id` field, since that is the path the app writes back to.

```json
{
  "id": "default-tests",
  "name": "Default Tests",
  "version": "2.0.1",
  "createdAt": "2026-04-18T09:41:59.077Z",
  "updatedAt": "2026-06-27T14:25:13.012Z",
  "defaultRunConfig": { "maxTokens": 2000 },
  "testCases": [
    {
      "id": "test-case-1",
      "name": "Planets",
      "input": {
        "type": "chat",
        "messages": [
          {
            "role": "system",
            "content": "You are a helpful assistant. Answer questions directly without any explanation."
          },
          {
            "role": "user",
            "content": "List the planets of our solar system in order from the Sun, separated by commas, all lowercase. DO NOT ADD ANY spaces to your response."
          }
        ]
      },
      "runConfig": { "temperature": 0 },
      "evaluations": [
        {
          "type": "exact_match",
          "expected": "mercury,venus,earth,mars,jupiter,saturn,uranus,neptune"
        }
      ],
      "passingLogic": "all"
    }
  ]
}
```

## Behaviour worth knowing

Ids are any unique string. The app writes UUIDs, but readable ids like `test-case-1` survive
a diff much better and work exactly the same.

A file is skipped at startup if it is not valid JSON, or if `id` or `createdAt` is missing.
It is left alone rather than repaired, with the reason in the logs.

`runConfig` overrides `defaultRunConfig` field by field, so a case setting only `temperature`
keeps the suite's `maxTokens`. Omitting a sampling field is not the same as setting it to
zero: leave it out and the provider's own default applies.

`input.type` accepts `chat`, `completion`, `json`, and `code`, but only `chat` with a
non-empty `messages` array takes the chat path. Everything else sends `prompt` as a plain
string.

An empty `evaluations` array is an error rather than a pass. The case scores 0 and reports
that nothing was configured.

`expected` is only ever read as a string. `json_match` therefore wants JSON *encoded in a
string*, not a nested object, and an object gives you "No expected JSON provided". Graded
types fall back to a `0.9` pass mark when `threshold` is omitted, except `cosine_similarity`,
which uses `0.8`. For what each evaluator scores and which fields it takes, see
[Evaluators](/docs/reference/evaluators/).

## Generating and sharing

Nothing in the app has to create these files, so turning a CSV of question and answer pairs
into a suite is a reasonable thing to script.

Restart the app to pick up files written underneath it. There is no file watcher, and a suite
open in the app will overwrite yours if it saves last.

A case carrying `promptRef` resolves its system prompt from the **Prompts** library at run
time, which makes the `messages` copy in the file stale and the suite not self-contained. The
matching file in `~/.cannonade/prompts` has to travel with it. See
[Prompts and versioning](/docs/guides/prompts-and-versioning/).
