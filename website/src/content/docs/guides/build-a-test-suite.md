---
title: Build a test suite
description: Define test cases, attach evaluators, and run a suite against several models at once.
sidebar:
  order: 3
---

A test suite is a named set of cases. A case is one prompt plus the evaluators that
decide whether the answer is good. You write a suite once and fire it at as many models
as you like, as often as you like.

## Anatomy of a case

Each case has:

- **A system prompt** — either typed inline or pulled from the Prompt library.
- **User input** — the message sent to the model.
- **Evaluators** — one or more checks applied to the output. A case passes when its
  evaluators pass.

Evaluators stack. A case can require that the output contains a phrase *and* stays above
a ROUGE threshold *and* parses as valid JSON. Each evaluator reports its own score, and
you see them broken out per case in the results.

## Creating a suite

1. Open **Test suites → New suite** and give it a name.
2. Add a case. Start with something you already know the answer to — a classification, a
   format constraint, a refusal you expect.
3. Attach an evaluator. `contains` and `exact_match` are the fastest to reason about;
   move to `rouge`, `f1`, or `llm_rubric` once you are grading open-ended text.
4. Repeat until the suite covers the behaviour you actually care about.

:::tip
Suites are more useful when the cases disagree with each other. A suite where every model
scores 100% tells you nothing. Include the cases small models fail.
:::

## Running against multiple models

Click **Run** and select models. This is the core loop: the same cases, the same
evaluators, every selected model, one table.

While the run is in progress you can watch each case resolve. When it finishes you get,
per model:

- pass rate across cases
- mean score per evaluator
- token counts and timing

Every run is saved to **Test runs** with its full output, so you can compare today's
results against the run you did before you changed the system prompt.

## Iterating on prompts

The usual workflow is:

1. Run the suite. Note which cases fail and on which models.
2. Change one thing — the system prompt, a sampling parameter, the phrasing of a case.
3. Run it again against the same models.
4. Compare the two runs.

Because runs are stored locally as JSON, the history is yours: nothing expires, nothing
is rate limited, and nothing leaves the machine.

## Sharing a suite

Suites can be exported and imported as JSON. That makes them reviewable in a pull
request, which is the practical way to keep a shared suite honest across a team.

:::caution
Imported suites are validated against a schema before they are loaded, and custom
validators run in a sandboxed JavaScript runtime rather than in the app process. Still,
treat a suite from a stranger the way you would treat any other code you did not write.
:::
