---
title: Settings
description: What the settings panes control, and the choices with consequences worth knowing.
sidebar:
  order: 4
---

Settings has six panes: **General**, **Appearance**, **Providers**, **Test Runs**,
**Output**, and **Experiments**. Changes save automatically, with no apply or confirm step.

## General

Holds the app version, the [data directory](/docs/reference/files-and-folders/) with a
button to open it, the log level, and a reset.

**Log level** controls what reaches the log file and the **Logs** view. `info` is the
default; drop to `debug` when you are chasing a provider problem and want the request detail.

:::caution
**Reset all settings** does more than restore preferences. It also removes every configured
provider, so you will be back at the onboarding screen with nothing to run against.

Stored API keys are not deleted with them. They stay encrypted in `credentials.json`,
orphaned but present, so re-adding a provider means re-entering its key.
:::

## Test Runs

This pane sets the **defaults** a new run starts with, not the run itself. Unload before,
unload after, auto-delete, and parallel are all seeded from here and can be changed per run
in the **New Run** panel.

:::note
**Parallel runs** only applies to cloud providers. Select it for a local provider and the
run goes sequential anyway, because local models compete for the same hardware.
:::

## The judge

The bottom of the **Test Runs** pane configures the model that grades `llm_rubric` and
`g_eval` evaluations. It is a single global choice: one provider, one model, used by every
LLM-graded evaluation in every suite.

Changing the judge changes what your existing scores mean. A suite graded by one judge and
re-run under another has not been re-tested, it has been re-graded, and the two runs are not
comparable.

Keep **judge temperature** low. A judge that answers differently on identical input makes
every score noisy, and you will read the noise as movement in the model you are testing.

## Output

Controls the HTML preview offered on outputs that look like markup.

The **template** is the useful part. Output is rendered inside whatever markup you put here,
with `{{content}}` marking where it goes, so you can preview output in something close to
the page it is destined for: a wrapper element your CSS targets, a `<style>` block, a
`<link>` to a stylesheet or font.

Leave it empty to render output on its own. Output that is already a complete HTML document
ignores the template. Without a `{{content}}` placeholder the output is appended after the
template rather than dropped.

This is display only. It never changes what the model returned or how `html_validation`
scores it.

## Experiments

Opt-in features that are not settled yet, off by default. See
[Experiments](/docs/reference/experiments/).
