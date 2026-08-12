---
title: Evaluators
description: Every scoring method Cannonade can apply to a model's output.
sidebar:
  order: 1
---

An evaluator takes a model's output and returns a score between 0 and 1 plus a
pass/fail verdict. Cases can carry several evaluators; each is scored independently.

Every evaluator supports **negate**, which inverts the verdict. That is how you assert
that an output *must not* contain something.

## Exact and literal

| Type          | What it does                                                          |
| ------------- | --------------------------------------------------------------------- |
| `exact_match` | Output must equal the expected string. Case sensitivity is optional.   |
| `contains`    | Output must contain the expected substring.                            |
| `regex`       | Output must match a regular expression.                                |

Use these when the correct answer is a known token: a label, a status code, a command.
They are instant, deterministic, and free.

## Text similarity

| Type          | What it does                                                                   |
| ------------- | ------------------------------------------------------------------------------ |
| `rouge`       | ROUGE-L overlap against a reference answer. Good for summaries.                 |
| `bleu`        | BLEU n-gram precision against a reference. Good for translation-shaped tasks.   |
| `f1`          | Token-level F1 against a reference. A reasonable general-purpose default.       |
| `levenshtein` | Normalised edit distance. Sensitive to small deviations in short strings.       |

These need a reference answer and a threshold. They reward wording that resembles the
reference, which is exactly right for extractive tasks and misleading for open-ended
ones.

## Structure

| Type              | What it does                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `json_match`      | Output must parse as JSON and match the expected structure.          |
| `html_validation` | Output must parse as well-formed HTML.                               |

Use these to check that a model respects an output contract, independently of whether the
content is correct. Pairing `json_match` with a `contains` check on a field value is a
common combination.

## Semantic

| Type                | What it does                                                                  |
| ------------------- | ----------------------------------------------------------------------------- |
| `cosine_similarity` | Embeds the output and the reference, then compares them. Catches paraphrases that overlap-based metrics miss. |

## Model-graded

| Type         | What it does                                                                     |
| ------------ | -------------------------------------------------------------------------------- |
| `llm_rubric` | A judge model scores the output against a rubric you write in plain language.      |
| `g_eval`     | G-Eval style scoring: the judge reasons through criteria before assigning a score. |

Model-graded evaluators are the only way to score genuinely open-ended output, and the
only ones with meaningful cost and latency. Two notes:

- Pick the judge deliberately. Judging is usually easier than answering, but a weak judge
  produces confident nonsense.
- Judge token usage is tracked separately in the run stats, so grading cost never hides
  inside the numbers for the model under test.

## Custom

| Type     | What it does                                                       |
| -------- | ------------------------------------------------------------------ |
| `custom` | Runs JavaScript you write, which returns a score and a verdict.     |

Custom validators execute in a sandboxed QuickJS runtime compiled to WebAssembly — no
filesystem, no network, no access to the app process. Use one when the check is
mechanical but specific: word counts, ordering constraints, unit consistency, a domain
format your organisation cares about.

## Choosing one

| The output is…                        | Start with                    |
| ------------------------------------- | ----------------------------- |
| A fixed label or value                | `exact_match`, `contains`     |
| A machine-readable payload            | `json_match`, `regex`         |
| A summary or a translation            | `rouge`, `bleu`, `f1`         |
| Correct in meaning but not in wording | `cosine_similarity`           |
| Open-ended prose or a judgement call  | `llm_rubric`, `g_eval`        |
| Constrained by a rule you can code    | `custom`                      |
