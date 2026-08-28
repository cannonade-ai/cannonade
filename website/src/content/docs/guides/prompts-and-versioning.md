---
title: Prompts and versioning
description: Save system prompts once, reuse them across test cases, and pin a case to a specific version.
sidebar:
  order: 3
---

A test case can carry its system prompt as free text, or link to an entry in the **Prompts**
library. Linking means the text lives in one place and every case that references it moves
together.

Each prompt keeps its full history. There is no "new version" button: saving changed content
appends a version, and the old one stays. Renaming a prompt or editing its description does
not, since neither changes what the model sees.

## Pinned or latest

A linked case stores the prompt id and a version, and that version is either a fixed number
or `latest`.

**Latest** follows the prompt. Edit the prompt and every case set to latest picks up the new
text on the next run, which is what you want while you are still iterating on wording.

**Pinned** freezes the case on one version. The prompt can move on and the case will not.
Pin when a case exists to catch a regression and you need its instructions held still, or
when you want two cases to run different versions of the same prompt side by side so the
suite compares them directly.

A pinned case shows its prompt read-only. Editing means switching it back to latest, which
also swaps in the latest text.

## Editing from a test case

The system prompt field in the test case editor is a live editing surface for the prompt
itself when the case is set to latest. Changing the text there and saving the case appends a
version to the shared prompt, so other cases on latest are affected too.

Free text that is not linked to anything can be promoted with the bookmark button next to the
field. Cannonade creates the prompt and switches the case to it.

## Restoring an old version

Selecting an earlier version in **Prompts** shows it read-only. **Set as Latest** copies its
content forward as a new version rather than deleting anything after it, so the history stays
append-only and cases pinned to the versions in between keep working.

## What runs actually record

A run resolves every prompt reference the moment it starts and stores the resulting text in
the run file. The run is a record of what was sent, not a pointer to what the prompt says
today, so later edits never rewrite past results.

That is what turns prompt engineering into something you can measure rather than guess at.
Change the prompt, run the same suite again, and the two runs each hold their own version of
the instructions, so an improvement you think you made is either in the scores or it is not.

:::note
Deleting a prompt leaves cases that referenced it holding their current text as free text.
Nothing breaks, but the link is gone and cannot be restored by recreating a prompt with the
same name.
:::

## Sharing

Prompts are individual JSON files, separate from suites. A suite that links to prompts is not
self-contained: copying it to another machine without the matching prompt files leaves those
cases pointing at ids that do not resolve. Copy both, or keep the prompt text inline in cases
you intend to hand around on their own.
