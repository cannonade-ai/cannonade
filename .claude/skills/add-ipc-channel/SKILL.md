---
name: add-ipc-channel
description: Add a new IPC channel between the Electron main process and the renderer. Covers all 5 files that must be touched.
---

Adding a new IPC channel requires changes in 5 files, in this order:

## 1. Channel constant — `src/shared/app/ipc-channels.ts` or `src/shared/provider/ipc-channels.ts`

Provider/secret channels live in `src/shared/provider/ipc-channels.ts`; everything else in `src/shared/app/ipc-channels.ts`.

```ts
export const MY_NAMESPACE = {
  DO_THING: 'my-namespace:doThing'
} as const
```

## 2. Main-process handler — `src/main/ipc/<domain>-handlers.ts`

One file per domain (`app-handlers.ts`, `chat-handlers.ts`, `suite-handlers.ts`, ...), each exporting a `registerXHandlers()` function. Add the channel to the matching file. Use `ipcMain.handle` for request-response, `ipcMain.on` for fire-and-forget.

```ts
export function registerMyNamespaceHandlers(): void {
  ipcMain.handle(MY_NAMESPACE.DO_THING, (_event, arg: string): string => {
    return 'result'
  })
}
```

If the domain is new, also call the register function from `registerHandlers()` in `src/main/ipc/handlers.ts` — that file is only an aggregator and holds no handlers itself.

Node-only packages (fs, child_process, vm2, etc.) belong here only — never import them in the renderer.

## 3. Preload bridge — `src/preload/index.ts`

Add to the `api` object:

```ts
doThing: (arg: string): Promise<string> =>
  ipcRenderer.invoke(MY_NAMESPACE.DO_THING, arg)
```

## 4. Type declaration — `src/preload/index.d.ts`

Add to the `AppAPI` interface:

```ts
doThing(arg: string): Promise<string>
```

## 5. Renderer API wrapper — `src/renderer/src/api/index.ts`

Add to the exported `api` object:

```ts
doThing: (arg: string): Promise<string> => window.api.doThing(arg)
```

Then call `api.doThing(...)` anywhere in the renderer.

---

Channel names follow the pattern `namespace:actionName`.
