---
title: Use cases
description: The decisions Cannonade puts numbers behind, from prompt iteration to choosing a model, a provider, and what it costs.
sidebar:
  order: 0
---

Writing a suite costs you an afternoon, and it pays that back by being re-run: against the
next model, the next prompt, the next version of a provider. These are the decisions it puts
numbers behind.

## Prompt engineering

Every save of a shared prompt appends a version, and a run stores the text it actually sent.
So the suite becomes the measurement: change the wording, run it again, and the improvement
you think you made is either in the scores or it is not.

Two versions can share a single run. Say you are tightening the voice of a support reply and
you think version 4 of the prompt is calmer than version 3: a duplicated case with one copy
pinned to each version, both carrying an `llm_rubric` criterion for the thing actually in
dispute, scores them on identical input. A rewrite you could only have opinions about comes
back as two numbers.

Temperature is worth holding at 0 for this comparison. Above it, a difference of a few points
is as likely to be sampling noise as it is the edit.

See
[Prompts and versioning](/docs/guides/prompts-and-versioning/).

## Comparing local models

A leaderboard tells you how a model handles someone else's questions. A suite built around
the work you actually need done, run across every candidate at once, puts them all on
identical inputs on the same hardware in the same session.

Breadth tends to beat volume here. Twenty cases that each catch a different failure tell you
more than two hundred variations of one question, and a suite that re-runs in a few minutes
is one that actually gets re-run. The inputs that embarrassed a model before are the ones
worth keeping: the ambiguous request, the one with a typo, the one where the right answer is
"I don't know".

The per-model pass rate is the summary, but the cases where models disagree carry the real
information. The ones everything passes are only proving your floor.

## Model discovery

A model you have never used inherits a suite that already exists. Adding it to the next run
of a suite you trust gives you its numbers on your own cases the day it ships, before anyone
has written up how good it is.

This is the cheapest use case to adopt because it needs no new work, and the one that
compounds: every suite you keep around is a permanent intake test for models that do not
exist yet. When a new release is interesting, the question is already written down.

## Regression checks

Models move underneath you: a provider updates a version behind a stable name, you swap a
gateway, someone edits a shared prompt. Re-running the suite tells you what changed.

A case kept for this purpose works best held still: pinned to a fixed prompt version rather
than following latest, and at temperature 0, so a re-run differs only where the model does. A
regression case left on the latest prompt eventually fails for a reason that has nothing to
do with the model, which is a confusing afternoon.

Runs are kept on disk as records of what was sent and what came back, so the comparison you
want is usually last month's run against today's, not today's against your memory of it.

## Structured output reliability

Working once in the playground is not the same as working twenty times out of twenty. The
output contract is worth scoring separately from the content, since a correct answer in the
wrong shape still breaks your code.

Say a case has to return a refund record with a status, an amount, and a currency.
`json_match` compares the key paths on both sides and scores the share that match, so it
catches the run where the model quietly drops the currency, not only the run where the
document fails to parse at all.

A second evaluator covers the rest: a `contains` check for a triple backtick, negated. Both
structure evaluators read the entire output, so perfect JSON inside a markdown fence scores
0, and the negated check is what tells you that is the reason rather than leaving you to
work it out from a case that looks inexplicably broken. See
[Evaluators](/docs/reference/evaluators/#structure).

## Cost calculation

Cases representing your smallest, largest, and typical inputs, run against the model you are
considering, report the tokens spent and the cost the provider charged. The figure comes from
real requests rather than a token count you estimated.

The spread is the point. A median case tells you the bill you expect; the large case tells
you the bill when a user pastes a whole document in, which is the one that hurts. That
maximum case earns its keep by being genuinely adversarial rather than merely longish, and
**Max Tokens** set to what production would really allow, since an unbounded reply is a
different price.

Per-case cost multiplied by the volume you expect, rather than the volume you hope for, is
the number worth writing down. Judge costs are reported apart from the model under test, so
a suite graded by `llm_rubric` will not inflate it.

Cloud providers report cost; local models usually report tokens and timing only.

## Cost optimization

The suite you already have answers the next question for you: does a cheaper model clear the
same bar? Put the expensive model and a few smaller ones in one run and read the pass rate
and the cost for each.

The cases define what good enough means, so dropping down becomes a decision you can defend
rather than a risk you are taking. A small model at 96% of the pass rate for a fraction of
the price is an easy call once both numbers are visible, and the cases it fails show exactly
what you would be giving up. Sometimes the answer is neither model but a split: the cheap one
for the common path, the expensive one for the cases you watched it fail.

Speed is worth reading next to cost, because price says nothing about latency either way. The
cheaper candidate might also be the faster one, which leaves no tradeoff to weigh, or it might
be slower than the model you are already paying for. Both happen, and which one you get
depends on the model, the hardware, and how the provider serves it, so the run is the only
place the answer exists.

## Provider comparison

The same weights served two different ways are not the same product. Price, speed, and what
the endpoint reports back all differ, and so do context limits and quantization choices the
server does not always advertise.

With both configured and pointed at the same cases, scores that diverge on identical inputs
and identical sampling settings mean something in the serving stack differs from what you
assumed. The reported metrics differ too: an OpenAI-compatible endpoint often returns less
than a native provider, and Cannonade leaves a number blank rather than estimating it. See
[Providers](/docs/reference/providers/#what-each-provider-supports).

This is not only a question about cloud gateways. Locally, a model file run through two
different servers is still two configurations, each with its own defaults for context size,
batching, offload, and how much of the model reaches the GPU. A difference in throughput
between them is worth knowing about before you settle on one, and the same suite measures it
the same way it measures anything else: both providers configured, both given the identical
cases, both reporting their own numbers.

## Sampling settings

Temperature, top_p, top_k, min_p, the repetition penalties, the seed, and max tokens are sent
with every request, so their values are part of what a run measures. They are often set once
from an example and not looked at again.

A suite carries a default set of these values, and any test case can override them. Running
the same cases at different values reports a pass rate and per-case scores for each, which is
what the comparison is based on.

These are request parameters rather than properties of the model or the machine, so they
apply to hosted and local models alike.

## Local model tuning

Locally, the same model at several quantization levels is several models. Two or three of
them in one run show where quality starts to go and whether the speed bought back is worth
it.

Quantization is not the only setting that affects the results. Context size, GPU offload, KV
cache type, and batch size are set on the server that loads the model, and they change speed,
memory use, and sometimes the output. A run measures the configuration as it was loaded, so
comparing two of them means running the same suite against each.

Advice about which quantization is safe gets passed around as a general rule, but it was
formed on a particular model doing a particular job. A run tells you whether it holds for the
model you are using and the work you need from it.

Speed deserves the same scepticism. A quantization that barely fits in memory can average
well and still stall on individual responses, so the minimum tokens per second is worth
reading next to the average rather than the average on its own. See
[Understand your results](/docs/guides/understand-your-results/).

See [Model downloads](/docs/guides/model-downloads/) for picking a quantization, and the
[test suite format](/docs/reference/test-suite-format/) if you would rather generate the
cases than click through them.
