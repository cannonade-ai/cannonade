---
title: Model downloads
description: Pull models from a provider registry or Hugging Face, pick a quantization, and download a model for a single run.
sidebar:
  order: 5
---

Local providers can fetch models from two places: the provider's own registry, and Hugging
Face. Both are reached from the download dialog in **Local Models**. Which sources a provider
offers is listed in [Providers](/docs/reference/providers/); pasting a Hugging Face URL
switches the source for you.

## Registry or Hugging Face

The registry expects a name exactly as the provider lists it, tag included. It is the shorter
path when the provider publishes a curated build of the model you want. Hugging Face takes 
either a model card URL or a `publisher/model-name` id, and the repositoryis read before 
anything downloads. Cannonade reads it anonymously, so a private repository cannot be resolved
at all.

## Quantization

A Hugging Face repository usually ships the same model at several quantization levels.
Cannonade preselects `Q4_K_M` when the repository has it, otherwise takes the first available.

The choice matters more than it looks: it decides how much memory the model needs and how
much quality it loses. Picking a level your machine cannot hold is the common cause of a
model that downloads fine and then fails to load.

Repositories with no GGUF quantizations offer no picker, and the provider takes whatever it
can use.

Registry downloads have no picker either. The tag in the name already identifies the build,
so quantization is part of what you typed.

## Downloading for a run

A test run does not have to be limited to models you already have. Naming a model that is not
installed makes the run download it before the cases start.

**Delete auto-downloaded models after the run** cleans those up again. It only removes models
that run actually downloaded: a model that was already installed is left alone, even when the
same run used it.

Downloads are per model run, so a failed download fails that model and leaves the rest of the
run going.

:::caution
This pairing is meant for sweeping a lot of different small models you want to check once. On
a large model it means paying the download cost every time you run the suite, so for anything
you are iterating against, install it once and leave it.
:::
