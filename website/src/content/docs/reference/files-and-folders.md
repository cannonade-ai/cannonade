---
title: Files and folders
description: Where Cannonade stores suites, runs, prompts, settings, and credentials on disk.
sidebar:
  order: 3
---

Everything Cannonade creates lives in one directory in your home folder:

```
~/.cannonade
```

On Windows that is `C:\Users\<you>\.cannonade`, on macOS `~/.cannonade`, and on
Linux `/home/<you>/.cannonade`. 

With one exception, the contents are plain JSON written with two-space indentation. You can
read them, diff them, back them up, and commit them to a repository.

## Layout

| Path                | What it holds                                                        |
| ------------------- | -------------------------------------------------------------------- |
| `suites/`           | One JSON file per test suite.                                        |
| `runs/`             | One JSON file per test run, with every case result.                  |
| `prompts/`          | One JSON file per prompt, containing all of its versions.            |
| `models/`           | Cache for the embedding model used by `cosine_similarity`.           |
| `logs/`             | The current log file plus rotated archives.                          |
| `settings.json`     | Application settings, including your configured providers.           |
| `credentials.json`  | Encrypted API keys. The one file that is not readable.               |
| `app-state.json`    | Window position and size, and any servers Cannonade started.         |

Downloaded language models are **not** here. Those stay wherever the provider keeps them,
because local providers like Ollama, LM Studio etc. each manage their own model storage and Cannonade
does not keep a second copy.

## Suites

`suites/<suite-id>.json`, named by the suite's own id.

A suite file is self-contained: the name, the description, the default sampling parameters,
and the full list of test cases with their evaluators. Nothing it needs lives elsewhere,
which is what makes copying one to another machine enough to move it.

Two exceptions are worth knowing before you share a suite. A case that links to a prompt
from the **Prompts** library stores only a reference to it, so the prompt itself has to
travel separately or the case falls back to whatever it finds. And a `custom` evaluator
carries JavaScript, which is code you are about to run.

:::caution
Cannonade executes `custom` evaluators in a sandboxed runtime with no filesystem and no
network access, but read a suite from a stranger the way you would read any other code you
did not write.
:::

The directory also holds a `.initialized` marker. It records that the bundled **Default
Tests** suite has been written once, so deleting that suite does not bring it back on the
next launch.

## Runs

`runs/<run-id>-<suite-name>.json`, where the suite name is slugified and truncated, giving
names like `a1b2c3d4-customer-support-tone.json`.

Each file is a complete record of one run: which model answered, every case's output and
reasoning, each evaluator's score and verdict, the timing and token metrics, and the
aggregate summary. Judge usage from `llm_rubric` and `g_eval` is stored separately from the
model under test, so grading cost never hides inside the model's numbers.

Runs are never pruned. They accumulate until you delete them.

## Prompts

`prompts/<prompt-id>.json`.

One file holds every version of a prompt, each with its content and the time it was
created. Editing a prompt appends a version rather than overwriting the previous one, so a
test case pinned to version 3 keeps resolving to version 3 no matter how many times the
prompt has changed since.

## Models

This is a cache, not a library. The first time a case uses the `cosine_similarity`
evaluator, Cannonade downloads a small embedding model here and reuses it from then on.
Removing the directory costs you a re-download and nothing else.

## Logs

`logs/main.log` is the current session. When Cannonade starts, a non-empty log from the
previous session is rotated to `YYYY-MM-DD_HH-MM.log`, named for when it was last written.
The current file is capped at 10 MB.

You do not have to open these by hand. The **Logs** view reads the same files, with level
filtering and a picker for the archives.

## Settings and credentials

`settings.json` holds everything in the settings modal, including your configured
providers: their names, base URLs, and which authentication method each one uses.

It does not hold any API key. Keys go one of two ways:

- **Environment variable**: nothing is stored at all. Cannonade reads the variable you
  named each time it needs the key.
- **Stored key**: the key is encrypted with the operating system's secret storage and
  written to `credentials.json` as base64.

`credentials.json` is therefore unreadable and tied to the machine and account that wrote
it. Copying it to another computer does not carry your keys over — the new machine cannot
decrypt it. Re-enter the keys there instead.

:::caution
`settings.json` is safe to commit. `credentials.json` is not useful to commit, but leave it
out of any repository regardless.
:::

`app-state.json` remembers your window geometry and, when the experimental
[Cannonade-managed servers](/docs/reference/providers/#managed-server-processes) setting is
on, which server processes Cannonade started, so it can stop exactly those and nothing else.

## Backing up

Copying `~/.cannonade` copies your work. To back up only what you authored, take `suites/`,
`prompts/`. Other folders like `runs/`, `models/` and `logs/` are regenerated, and `credentials.json`
will not decrypt anywhere else.

For version control, a repository holding `suites/` and `prompts/` works well: suite changes
show up as readable diffs, and a pull request against a suite reviews like any other change.