---
title: Understand your results
description: How Cannonade scores a test run, and how to read the numbers it reports.
sidebar:
  order: 2
---

Most of a run reads itself: open a run from **Test Runs**, expand a model, expand a case.
This page covers the parts that do not: how a score is arrived at, why judge cost is kept
separate, and what the numbers do and do not tell you.

## Score and verdict are not the same thing

A case score is the **mean of its evaluator scores**. Whether the case passed is decided
separately, by its passing logic.

The two can disagree, and it is not a bug:

- With `any` logic, one evaluator at 100% and another at 0% is a case that **passed** with a
  score of 50%.
- With `all` logic, four evaluators at 95% and one at 40% is a case that **failed** while
  scoring 84%.

Read the verdict for whether the case met your bar, and the score for how close everything
was. Scores are colour-graded against each case's own threshold, so a near miss looks
different from a flat failure.

:::tip
A case that fails with a high score is usually a threshold problem, not a model problem. A
case that fails at 0% is usually a format problem, so check whether the model wrapped its
answer in a code fence.
:::

## Judge cost is tracked separately

The `llm_rubric` and `g_eval` evaluators send the output to a second model for grading. That
judge spends its own tokens and, on a cloud provider, its own money, so runs report **Total**
and **Judge** as two numbers.

They are never added together. Doing so would make a cheap model graded by an expensive
judge look expensive, and the figure would move as soon as you changed the judge, without
the model under test changing at all. The judge is set once in **Settings > Test Runs**, so
it is constant across every model in a run and never distorts a comparison between them.

## Missing numbers are missing on purpose

Cannonade reports what the provider gives it and leaves the rest blank rather than
estimating. A local model usually shows timing and token counts but no cost; an
OpenAI-compatible endpoint often reports less than a native provider. See
[Providers](/docs/reference/providers/#what-each-provider-supports) for what to expect from
each one.

One number is worth reading closely when it is there: the **min and max** on tokens per
second. A model averaging 40 tokens/s with a floor of 6 behaves very differently under load
than one that never drops below 35, and the average alone hides that.

## When a run goes wrong

- **A model failed with no cases.** It never answered: not found, server down, or it failed
  to load. The error sits on the model row.
- **Every case timed out.** The model is likely still loading or too large for the hardware.
  Raise the limit in **Settings > Test Runs**, or set a per-case timeout.
- **Every case scored 0%.** Usually a format mismatch, not a knowledge failure. Read one
  output against what the evaluator wanted.
- **An evaluator scored `n/a`.** The grader failed, not the model: an unreachable judge, or
  custom JavaScript that threw an error. Fix that before reading anything into the run.

## Scanning a lot of cases

The **Fields** button in the run toolbar toggles which sections of an open case are shown.
Turning off system prompt and input, which are identical across every model in the run,
makes it much faster to scan twenty cases for what actually differed. The setting persists,
so turn them back on when you are debugging a single case.
