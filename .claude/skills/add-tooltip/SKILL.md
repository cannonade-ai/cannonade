---
name: add-tooltip
description: |
  Adds a tooltip using this project's existing tooltip system.
  Use when: explaining an ambiguous field, label, button, icon, or truncated text;
  adding a hover/focus hint; surfacing help text in-app instead of in docs.
---

# Add Tooltip

This project has one tooltip engine with two front-ends. Do not build a new one — pick the right existing front-end for the spot.

| Front-end | What it is | Use it for |
|-----------|------------|------------|
| `InfoTooltip` component | A small circle-"i" icon you place next to something. Has its own teleported panel and supports rich slot content. | Explaining a **concept**: form fields, labels, toggles, settings rows. The thing being explained has no obvious hover target, so the icon *is* the target. |
| `v-tooltip` directive | A hover/focus label attached to an element that already exists. Singleton, plain string only. | Annotating an **existing element**: icon buttons, truncated text, status chips. No extra icon — the element itself is the target. |

Both share styling and positioning (`src/renderer/src/utils/tooltipPosition.ts`, `src/renderer/src/styles/tooltip.scss`).

## How to decide

1. **Is the target a labeled `Field`?** → Use the `Field` `hint` prop (renders an `InfoTooltip` for you). This is the most common case near inputs.
2. **Else, does the spot need an explanatory icon because there's nothing natural to hover** (a toggle row, a section header, a standalone label)? → Use `<InfoTooltip>`.
3. **Else, is there already an element** (button, badge, truncated span) whose meaning needs a short label? → Use `v-tooltip`.
4. **Does the content need a link, an icon, or any markup/component?** → Use `<InfoTooltip>` with a **slot** + `interactive` (the directive is plain-text only).

When unsure between 2 and 3: if you'd have to add a new element just to hang the tooltip on, that's `InfoTooltip`; if an element is already there, that's `v-tooltip`.

## Option A — `Field` hint (preferred near inputs)

`Field` already renders an `InfoTooltip` next to its label when given `hint`:

```html
<Field label="Temperature" hint="Higher values give more varied, creative answers; lower is more focused.">
  <NumberInput v-model="config.temperature" :min="0" :max="1" :step="0.05" />
</Field>
```

## Option B — `InfoTooltip` component

Import from the ui barrel: `import { InfoTooltip } from '@renderer/components/ui'`

Plain text:
```html
<span class="some-label-row">
  Parallel run
  <InfoTooltip content="Sends requests to multiple models at the same time to finish faster." />
</span>
```

Rich content (links / icons / components) — pass a **slot** and set `interactive` so the user can move onto the panel and click:
```html
<InfoTooltip interactive>
  Search
  <a href="https://huggingface.co/models" target="_blank" rel="noopener noreferrer">huggingface.co</a>
  for a model.
  <a href="<docs-url>" target="_blank" rel="noopener noreferrer">Docs <IconExternalLink :size="12" /></a>
</InfoTooltip>
```

### InfoTooltip props

| Prop          | Type      | Default | Notes                                                              |
|---------------|-----------|---------|--------------------------------------------------------------------|
| `content`     | string    | `''`    | Plain-text fallback, used when no slot is provided.                |
| `placement`   | string    | `'top'` | `top` \| `bottom` \| `left` \| `right`.                            |
| `size`        | number    | `14`    | Icon size in px.                                                   |
| `delay`       | number    | `100`   | Show delay in ms.                                                  |
| `interactive` | boolean   | `false` | Lets the pointer move onto the panel. **Required for links/copy.** |

Slot content is owned by the calling component, so its **scoped styles still apply** even though the panel is teleported to `<body>` — style slot markup in the caller's `<style scoped>`.

## Option C — `v-tooltip` directive

Registered globally; no import needed. Value is a string or an options object. Placement can also be the directive arg.

```html
<!-- string shorthand -->
<Button v-tooltip="'Refresh status'" type="icon" :icon="IconRefresh" />

<!-- placement via arg -->
<Button v-tooltip:bottom="'Edit provider'" type="icon" :icon="IconPencil" />

<!-- options object: interactive lets you hover the tooltip to select/copy long text -->
<span v-tooltip="{ content: fullText, interactive: true }">{{ truncated }}</span>
```

### Directive options

| Key           | Type    | Default | Notes                                              |
|---------------|---------|---------|----------------------------------------------------|
| `content`     | string  | —       | The label text (plain text only).                  |
| `placement`   | string  | `'top'` | Overrides the directive arg.                       |
| `delay`       | number  | `750`   | Show delay in ms.                                  |
| `interactive` | boolean | `false` | Keeps the tooltip open while hovered, for copying. |

## Rules

- Replace native `title` attributes that are genuine hover hints with `v-tooltip`. Leave component `title` **props** (panel/modal headings) alone.
- The directive is plain text. Anything with a link, icon, or component → `InfoTooltip` slot + `interactive`.
- Only use `interactive` when the user needs to reach the panel (links, copyable text). Otherwise leave it off — it adds an I-beam cursor and a hide delay.
- `InfoTooltip` slots render real markup; never interpolate untrusted user input into them.
- Keep copy short and plain-language — one or two sentences. Don't over-explain.
