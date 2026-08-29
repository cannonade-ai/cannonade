---
title: Playground
description: Chat with a single model, tune sampling parameters, and try a prompt before committing it to a suite.
sidebar:
  order: 4
---

The Playground is a single conversation with a single model. It is where you find out what a
model does with a prompt before you write a test case around it, and where you go when a case
fails and you want to poke at the model directly. Conversations are not saved.

## Trying a prompt

The system prompt panel loads any entry from the **Prompts** library at a chosen version, so
what you send here is exactly what a linked test case would send. Editing the loaded text
marks it modified and leaves the saved prompt untouched. Nothing you do here writes back to
the library, unlike the same field in the test case editor.

That makes the Playground the safe place to draft wording. Once it behaves, save it as a
prompt and point cases at it. See
[Prompts and versioning](/docs/guides/prompts-and-versioning/).

Model cards and prompts both have actions that open the Playground with that model or prompt
already selected.

## Parameters

The parameters panel is the same set a suite applies to its cases, so a value that fixed a
problem here means the same thing when you set it on a suite. They are separate settings
though: tuning temperature in the Playground never changes a suite.

**Extra request data** is raw JSON merged into the request body, and
its keys win over the fields above it, so it reaches provider features Cannonade has no
control for. Structured output schemas are the common use.

Changing the model mid-conversation is allowed. The whole history is replayed to the new
model on the next message, so you can ask two models the same follow-up in one thread. The
per-message badge records which model produced which reply.

## Reading a response

Each reply carries token count, tokens per second, and time to first token, the same
measurements a run records per case. The tooltip beside them holds the provider's raw stats
payload, which is the fastest way to see what a given endpoint actually reports.

Models that return reasoning show it above the answer, collapsed. Assistant replies render as
markdown, and a toggle switches to raw text, which is what you want when checking whether the
model really emitted a JSON object or a code fence wrapped around one.
