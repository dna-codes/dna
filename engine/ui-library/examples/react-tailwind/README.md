# Example — React + Tailwind

A small project-dashboard prototype built entirely from `@dna/ui-library`,
styled **only** through its Tailwind plugin. It exercises the full stack of the
library:

- **Structural primitives:** `Application`, `Header`, `Sidebar`, `Footer`,
  `Page`, `ApplicationModule`.
- **State-machine UI:** the headless `Machine` engine — `Machine.Root` /
  `Machine.State` / `Machine.Send` driving a content-publishing lifecycle
  (Module 2) — **and** `Workflow` (a multi-step stepper, Module 4).
- **Fine-grained widgets:** `Button` (variants/sizes), `Badge`, `Card`, `Tabs`,
  `Dialog`, `Tooltip`, `Avatar`, `Select`, `Switch`, `Checkbox`, `RadioGroup`,
  `Slider`, `Input`, `Textarea`, `Label`, `Progress`, `Separator`.

## Machine inspector

The whole shell is wrapped in a single `Machine.Root` running an XState v5
machine (`contentMachine`). Module 2 renders a progress trail plus, for each
state, only the `Machine.Send` moves valid from there (a primary "→" forward
step and a "←" back step where the machine allows one). The right-hand
**inspector sidebar** (pinned with `position: sticky`) subscribes to the *same*
actor — through `useMachineActor` / `useMachineState` — and shows its live
state, which events are currently available, and a running history of the states
it has entered. Drive Module 2 and watch the inspector update in lockstep.

## How the styling works

`tailwind.config.js` registers the library's plugin:

```js
import dnaUi from "@dna/ui-library/tailwind";
export default { content: [...], plugins: [dnaUi] };
```

The plugin is turnkey — it injects the `--ui-*` tokens **and** the default skin
into Tailwind's base layer, so `src/index.css` only needs the standard
`@tailwind base/components/utilities`. No library CSS is imported. Layout uses
ordinary Tailwind utilities, and a few token-backed ones (`bg-ui-surface`,
`text-ui-muted`, `font-ui-semibold`) demonstrate the plugin's theme mapping.

Re-theme everything by overriding any `--ui-*` variable in your own CSS.

## Run it

This example consumes the library from the repo root via a `file:` dependency,
so build the library first:

```bash
# from the repo root
npm install && npm run build

# then in this folder
cd examples/react-tailwind
npm install
npm run dev      # http://localhost:5173
```
