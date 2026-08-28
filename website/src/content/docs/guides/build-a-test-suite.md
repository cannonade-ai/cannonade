---
title: Build a test suite
description: Define test cases, attach evaluators, and run a suite against several models at once.
sidebar:
  order: 1
---

A test suite is a named set of cases. A case is one prompt plus the evaluators that decide
whether the answer is good.

## Anatomy of a case

Each case has:

- **A name** and an optional description.
- **A system prompt**, either typed inline or linked to an entry in the **Prompts**
  library. A linked prompt can be pinned to a version or follow the latest one.
- **User input**, the message sent to the model.
- **Evaluators**, one or more checks applied to the output.
- **Passing logic**, either `all` (every evaluator must pass) or `any` (one is enough).

Evaluators stack. A case can require that the output contains a phrase, stays above a ROUGE
threshold, and parses as valid JSON. Each evaluator reports its own score, and you see them
broken out per case in the results. The case score is the mean of its evaluator scores,
while pass or fail comes from the passing logic.

## Creating a suite

1. Open **Test Suites**, create a suite, and give it a name.
2. Add a case. Start with something you already know the answer to: a classification, a
   format constraint, a refusal you expect.
3. Attach an evaluator. `contains` and `exact_match` are the fastest to reason about; move
   to `rouge`, `f1`, or `llm_rubric` once you are grading open-ended text.

Sampling parameters such as temperature, top-p, and max tokens are set on the suite and
apply to every case in it.

:::tip
Suites are more useful when the cases disagree with each other. A suite where every model
scores 100% tells you nothing. Include the cases small models fail.
:::

## Running against several models

Open **Test Runs**, click **New Run**, then pick the suite, a provider, and the models to
test. The same cases and the same evaluators run against every model you selected.

For local providers you are not limited to models you already have. Give a registry id or a
[Hugging Face](https://huggingface.co/models) id and Cannonade downloads the model for the run. A run option can delete
those downloads afterwards so they do not pile up.

Other run options worth knowing:

- **Unload other models before the run** and **unload after the run**, to keep memory free.
- **Parallel runs**, which tests several models at once. This is available for external
  providers only, since local models compete for the same hardware.
- **Default test timeout**, a per-case limit set in **Settings > Test Runs**.

While the run is in progress you can watch each case resolve. When it finishes, each model
reports:

- cases passed and failed
- average score
- tokens per second, time to first token, and duration
- token usage and cost, where the provider reports them

Judge model usage from `llm_rubric` and `g_eval` is tracked separately, so grading cost
never hides inside the numbers for the model under test.

Every run is saved to **Test Runs** with its full output, so you can compare today's results
against the run you did before you changed the system prompt.

## Iterating on prompts

The usual workflow is:

1. Run the suite. Note which cases fail and on which models.
2. Change one thing: the system prompt, a sampling parameter, the phrasing of a case.
3. Run it again against the same models.
4. Compare the two runs.

Versioned prompts help here. Save the system prompt in **Prompts**, edit it to create a new
version, and the run history tells you which version produced which result.

Because runs are stored locally as JSON, the history is yours: nothing expires, nothing is
rate limited, and nothing leaves the machine (external providers excepted, obviously).

## Sharing a suite

Each suite is a JSON file in `~/.cannonade/suites`, which **Settings > General** can open
for you. Copying that file to another machine, or committing it to a repository, is all it
takes to share a suite or review a change to one in a pull request. See
[Files and folders](/docs/reference/files-and-folders/) for what else is stored there.

:::caution
A suite can carry `custom` evaluators, which are JavaScript. Cannonade runs them in a
sandboxed runtime with no filesystem and no network access, but still read a suite
from a stranger the way you would read any other code you did not write.
:::
