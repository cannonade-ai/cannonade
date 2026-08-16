---
title: Evaluators
description: Every scoring method Cannonade can apply to a model's output.
sidebar:
  order: 1
---

An evaluator takes a model's output and returns a score between 0 and 1 plus a pass or fail
verdict. A case can carry several evaluators, each scored independently, and its passing
logic decides whether all of them or any one of them has to pass.

## Shared options

**Threshold.** Evaluators that produce a graded score pass when the score reaches the
threshold. The editor exposes it for `rouge`, `bleu`, `f1`, `levenshtein`,
`html_validation`, `cosine_similarity`, and `custom`, starting at `0.9`. `contains` and
`json_match` also score on a scale but use a fixed pass mark of `0.9`, and `exact_match` and
`regex` are pass or fail on their own.

**Case sensitive.** Available on `exact_match`, `contains`, `regex`, `rouge`, `bleu`, `f1`,
and `levenshtein`. Matching is case-insensitive by default, except for `exact_match`, which
starts case-sensitive.

**Negate.** Inverts the result, which is how you assert that an output *must not* contain
something. The score becomes `1 - score` and is compared against the threshold again. Every
evaluator supports it except `custom`, where the function itself is the place to express
the inversion.

## Exact and literal

| Type          | What it does                                                             |
| ------------- | ------------------------------------------------------------------------ |
| `exact_match` | Output must equal the expected string. Both sides are trimmed first.      |
| `contains`    | Output must contain the expected terms.                                   |
| `regex`       | Output must match a regular expression.                                   |

`contains` accepts a comma-separated list, and scores the fraction of terms found, so three
terms out of four gives `0.75`, which is below the pass mark. Use a single term when you
want a plain yes or no.

Use these when the correct answer is a known token: a label, a status code, a command. They
are instant, deterministic, and free.

## Text similarity

| Type          | What it does                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| `rouge`       | ROUGE-L overlap against a reference answer. Good for summaries.              |
| `bleu`        | BLEU bigram precision against a reference. Good for translation-shaped tasks. |
| `f1`          | F1 over the unique whitespace-separated tokens of each side.                  |
| `levenshtein` | Edit distance normalised by the longer string. Sensitive to small deviations. |

These need a reference answer and a threshold. They reward wording that resembles the
reference, which is exactly right for extractive tasks and misleading for open-ended ones.

## Structure

| Type              | What it does                                                          |
| ----------------- | --------------------------------------------------------------------- |
| `json_match`      | Output and expected value must both parse as JSON, then key paths are compared. |
| `html_validation` | The whole output must be HTML, and its elements are scored against your tag rules. |

`json_match` collects every key path on both sides and scores the share that matches,
measured against whichever side has more paths. Missing keys and extra keys both lower the
score.

`html_validation` fails outright if the output has text sitting outside any element, or no
elements at all. Otherwise it scores the share of elements that are accepted. With no tag
rules, any recognised HTML tag is accepted; **allowed tags** narrows that to a list, and
**blocked tags** rejects specific tags wherever they appear.

:::caution
Both evaluators read the entire output, so a model that wraps its answer in a markdown code
fence scores 0 even when the markup or the JSON inside the fence is perfect. The same goes
for a sentence of preamble before the payload. If your cases keep failing this way, the fix
belongs in the system prompt: tell the model to reply with the raw document and nothing
else.
:::

Use these to check that a model respects an output contract, independently of whether the
content is correct. Pairing `json_match` with a `contains` check on a field value is a
common combination.

## Semantic

| Type                | What it does                                                       |
| ------------------- | ------------------------------------------------------------------ |
| `cosine_similarity` | Embeds the output and the reference, then compares the two vectors. |

This catches paraphrases that overlap-based metrics miss. It uses a small embedding model
that runs inside Cannonade, downloaded to the app data folder the first time you use it, so
scoring costs nothing and needs no provider.

## Model-graded

| Type         | What it does                                                                     |
| ------------ | -------------------------------------------------------------------------------- |
| `llm_rubric` | A judge model decides whether the output satisfies a criterion you write in plain language. |
| `g_eval`     | The judge first turns your criteria into evaluation steps, then scores the output against them. |

The judge model is chosen once, in **Settings > Test Runs**, and any configured provider can
supply it. Both evaluators accept `{{output}}` and `{{input}}` placeholders, which are
replaced with the model output and the case input.

The judge returns its own verdict and score. A threshold is optional here and stacks on top:
when set, the judge must both pass the output and score it at least that high.

Three things worth knowing:

- Pick the judge deliberately. Judging is usually easier than answering, but a weak judge
  produces confident nonsense.
- `g_eval` costs two judge calls per test case, one to derive the steps and one to grade.
- Judge token usage is tracked separately in the run stats, so grading cost never hides
  inside the numbers for the model under test.

## Custom

| Type     | What it does                                                    |
| -------- | --------------------------------------------------------------- |
| `custom` | Runs JavaScript you write, which returns a score and a detail string. |

The function receives the output and returns `{ score, details }`, where the score is
clamped to the 0 to 1 range and compared against the threshold:

```js
(output) => {
  return {
    score: output.split('\n').length <= 3 ? 1.0 : 0.0,
    details: 'At most three lines'
  }
}
```

Custom validators execute in a sandboxed QuickJS runtime compiled to WebAssembly, with no
filesystem, no network, and no access to the app process. They are capped at five seconds
and 64 MB of memory. Use one when the check is mechanical but specific: word counts,
ordering constraints, unit consistency, a domain format your organisation cares about.

## Choosing one

| The output is                         | Start with                    |
| ------------------------------------- | ----------------------------- |
| A fixed label or value                | `exact_match`, `contains`     |
| A machine-readable payload            | `json_match`, `regex`         |
| Markup                                | `html_validation`             |
| A summary or a translation            | `rouge`, `bleu`, `f1`         |
| Correct in meaning but not in wording | `cosine_similarity`           |
| Open-ended prose or a judgement call  | `llm_rubric`, `g_eval`        |
| Constrained by a rule you can code    | `custom`                      |
