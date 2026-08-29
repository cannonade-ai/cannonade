---
title: Experiments
description: Opt-in features that are not finished yet, and what to expect from each one.
sidebar:
  order: 5
---

Experiments are features that work but are not settled. They are off by default, can change
without notice, and may be removed. Turn them on in **Settings > Experiments**.

## Cannonade-managed servers

Adds process-level **Start** and **Stop** to local providers that offer no way to shut
themselves down. Until you enable it, those provider cards show no server status at all.

**Start** launches the server itself, which needs the provider's own executable on your
`PATH`, and Cannonade remembers the process it spawned. **Stop** ends that process, and
anything still running is ended when you quit.

The rule it follows: **it only stops what it started.** An application you launched
yourself, with its own window or tray icon, is left alone.

Providers whose servers can already stop themselves are unaffected. The
[capability table](/docs/reference/providers/#what-each-provider-supports) marks which is
which.

:::caution
Stopping means ending a process, not asking it politely. Anything in flight, such as a model
download or a model being loaded, can be cut short.
:::
