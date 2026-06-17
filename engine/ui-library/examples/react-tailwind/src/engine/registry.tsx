import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Application,
  ApplicationModule,
  Page,
  Header,
  Footer,
  Sidebar,
  Card,
  Tabs,
  Workflow,
  Machine,
  Button,
  Badge,
  Avatar,
  Label,
  Input,
  Textarea,
  Select,
  Switch,
  Checkbox,
  RadioGroup,
  Slider,
  Separator,
  Dialog,
  Tooltip,
  Progress,
  Skeleton,
  useMachineState,
  createMachine,
  useActorRef,
} from "@dna/ui-library";
import type { ButtonProps } from "@dna/ui-library";
import type { MachineJSON, Resource } from "./types";
import { useActorRegistry } from "./actorRegistry";
import { makeActivityInspect, useActivityLog } from "./activityLog";
import { useAccess } from "./access";

type Variant = ButtonProps["variant"];
type Size = ButtonProps["size"];

/**
 * Context handed to a renderer's `map`. It exposes the resource being rendered,
 * a `resolve` to follow an arbitrary edge by id (for later reference edges),
 * and `slot` to render the contained children of a named slot.
 */
export type RenderCtx = {
  resource: Resource;
  resolve: (id: string) => Resource | undefined;
  /** Look up a machine config (JSON) by id — used by `machine-root`. */
  machine: (id: string) => MachineJSON | undefined;
  /** Rendered children contained in `name` (default slot when omitted); `null` if empty. */
  slot: (name?: string) => ReactNode;
};

/**
 * A registry entry: how one resource `type` becomes UI.
 *
 * - `component` is the element/component to render (omit for pure-composition
 *   types like `box`/`heading` that return their own markup via `map`).
 * - `map` translates the resource's config into real props and/or children.
 *   Children default to the resource's contained children (the default slot).
 *
 * The engine forwards `className`/`style` from `resource.props` to `component`
 * automatically, so `map` only handles the type-specific translation. It never
 * makes a visual decision — styling stays in the skin.
 */
export type Renderer = {
  component?: ComponentType<Record<string, unknown>>;
  map?: (ctx: RenderCtx) => { props?: Record<string, unknown>; children?: ReactNode };
};

export type Registry = Record<string, Renderer>;

/** Narrow read of a resource's loosely-typed `props` bag. */
function p(resource: Resource): Record<string, unknown> {
  return resource.props ?? {};
}

/**
 * Adapt a strongly-typed library component (some require props like `value`)
 * to the registry's loose `component` slot. The matching `map` supplies the
 * real props at render time; this only relaxes the static type.
 */
function lib<P>(C: ComponentType<P>): ComponentType<Record<string, unknown>> {
  return C as unknown as ComponentType<Record<string, unknown>>;
}

/* ------------------------------------------------------------------ *
 * Small composites — repetition / nested-Radix clusters wrapped as one
 * type. DNA still names the type + props; the registry owns granularity.
 * ------------------------------------------------------------------ */

type Option = { value: string; label: string };

/** A read-only flow trail that highlights the surrounding machine's state. */
function FlowSteps({ steps }: { steps: Option[] }) {
  const current = useMachineState((s) =>
    typeof s.value === "string" ? s.value : JSON.stringify(s.value),
  );
  const activeIndex = steps.findIndex((s) => s.value === current);

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ui-sm">
      {steps.map((step, i) => {
        const status =
          i < activeIndex ? "done" : i === activeIndex ? "active" : "upcoming";
        return (
          <li key={step.value} className="flex items-center gap-2">
            <span
              className={
                "rounded-ui-pill px-3 py-1 font-ui-medium " +
                (status === "active"
                  ? "bg-ui-primary text-ui-on-primary"
                  : status === "done"
                    ? "bg-ui-surface-raised text-ui-text"
                    : "text-ui-text-muted")
              }
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className="text-ui-text-muted">
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** A vertical nav of buttons that tracks its own active item. */
function NavList({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Button
          key={item}
          variant={item === active ? "secondary" : "ghost"}
          onClick={() => setActive(item)}
          className="justify-start"
        >
          {item}
        </Button>
      ))}
    </nav>
  );
}

/** A divided list of avatar / title / subtitle / toggle rows. */
function ItemList({ items }: { items: string[] }) {
  return (
    <ul className="divide-y" style={{ borderColor: "var(--ui-color-border)" }}>
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-3 py-3">
          <Avatar>
            <Avatar.Fallback>I{i + 1}</Avatar.Fallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-ui-medium">{item}</div>
            <div className="text-ui-sm text-ui-text-muted">Subtitle</div>
          </div>
          <Label className="flex items-center gap-2">
            <span className="text-ui-sm text-ui-text-muted">Toggle</span>
            <Switch defaultChecked={i === 0} />
          </Label>
        </li>
      ))}
    </ul>
  );
}

/** A labelled Radix Select built from a flat option list. */
function SelectField({
  options,
  defaultValue,
  placeholder,
  "aria-label": ariaLabel,
}: {
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  return (
    <Select defaultValue={defaultValue}>
      <Select.Trigger aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon>▾</Select.Icon>
      </Select.Trigger>
      <Select.Content>
        {options.map((opt) => (
          <Select.Item key={opt.value} value={opt.value} indicator="✓">
            {opt.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}

/** A fieldset-wrapped Radix RadioGroup built from a flat option list. */
function RadioGroupField({
  legend,
  options,
  defaultValue,
}: {
  legend: string;
  options: Option[];
  defaultValue?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-ui-sm font-ui-medium">{legend}</legend>
      <RadioGroup defaultValue={defaultValue}>
        {options.map((opt) => (
          <Label key={opt.value} className="flex items-center gap-2">
            <RadioGroup.Item value={opt.value} />
            {opt.label}
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

/** A confirm/cancel Dialog fronted by a trigger button. */
function ConfirmDialog({
  triggerLabel,
  triggerVariant,
  triggerClassName,
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirmVariant,
}: {
  triggerLabel: string;
  triggerVariant?: Variant;
  triggerClassName?: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmVariant?: Variant;
}) {
  return (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button variant={triggerVariant} className={triggerClassName}>
          {triggerLabel}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description>{description}</Dialog.Description>
        <div className="mt-4 flex justify-end gap-2">
          <Dialog.Close asChild>
            <Button variant="secondary">{cancelLabel}</Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <Button variant={confirmVariant}>{confirmLabel}</Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

/**
 * Binds an XState machine **declared in the DNA** (JSON form) and provides its
 * actor to descendants. `config` is the `MachineJSON` the `machine-root` map
 * looked up from `dna.machines`, and `machineId` is the key it was found under;
 * the engine forwards `className` / `data-dna-id`.
 *
 * The machine is built once (memoized on the config object) — re-creating it
 * each render would reset the actor's state. We own the actor here (via
 * `useActorRef`) so we can both hand it to `Machine.Root` *and* register it in
 * the engine's actor registry, which lets an app-level tool (the inspector)
 * observe every machine in the app, not just one. We also pass an `inspect`
 * callback that streams every operation the actor processes into the engine's
 * activity log (the audit/activity trail). `Machine.Root` runs the
 * landmark `<div data-ui-machine data-state>`; descendant `machine-state` /
 * `machine-send` resources read the actor from context. This is the seam that
 * makes the app state-machine driven *from DNA*.
 */
function MachineRoot({
  config,
  machineId,
  className,
  children,
  "data-dna-id": dataDnaId,
}: {
  config?: MachineJSON;
  machineId?: string;
  className?: string;
  children?: ReactNode;
  "data-dna-id"?: string;
}) {
  const machine = useMemo(
    () =>
      createMachine(
        (config ?? { states: {} }) as Parameters<typeof createMachine>[0],
      ),
    [config],
  );
  const log = useActivityLog();
  const inspect = useMemo(
    () => makeActivityInspect(log, machineId ?? "machine"),
    [log, machineId],
  );
  const actorRef = useActorRef(machine, { inspect });
  const registry = useActorRegistry();
  useEffect(
    () => registry?.register(machineId ?? "machine", actorRef),
    [registry, machineId, actorRef],
  );
  return (
    <Machine.Root actorRef={actorRef} className={className} data-dna-id={dataDnaId}>
      {children}
    </Machine.Root>
  );
}

/**
 * A transition trigger: dispatches `event` to the surrounding machine, with two
 * independent gates that both keep the button **visible but disabled** —
 *
 * 1. the machine's own `snapshot.can` (handled by `Machine.Send`), and
 * 2. **access**: when `requires` is set, the current actor must be permitted
 *    that action (Actor › Action › Resource — see `access.tsx`). So a transition
 *    only advances the machine if you're acting as a user who may perform it.
 *
 * The access gate is UX only (a determined caller could still send the event) —
 * real enforcement would be an XState guard; not a security boundary.
 */
function MachineSend({
  event,
  variant,
  label,
  requires,
  "data-dna-id": dataDnaId,
}: {
  event?: string;
  variant?: Variant;
  label?: ReactNode;
  requires?: string;
  "data-dna-id"?: string;
}) {
  const access = useAccess();
  const denied = typeof requires === "string" && !access.can(requires);
  return (
    <Machine.Send
      event={event as string}
      asChild
      disabled={denied}
      data-dna-id={dataDnaId}
      title={denied ? `Requires "${requires}"` : undefined}
    >
      <Button variant={variant}>{label}</Button>
    </Machine.Send>
  );
}

/* ------------------------------------------------------------------ *
 * The default registry — every resource type the example's DNA uses.
 * ------------------------------------------------------------------ */

/**
 * Maps DNA resource types onto `@dna/ui-library` components. Structural
 * primitives and plain widgets dispatch straight to a library component;
 * repetition and nested-Radix clusters route through the small composites
 * above. The map never makes a visual decision — styling stays in the skin.
 */
export const defaultRegistry: Registry = {
  /* Structural primitives. */
  application: { component: lib(Application) },
  tooltipProvider: {
    component: lib(Tooltip.Provider),
    map: (c) => ({ props: { delayDuration: p(c.resource).delayDuration } }),
  },
  header: { component: lib(Header) },
  footer: { component: lib(Footer) },
  sidebar: { component: lib(Sidebar) },
  module: {
    component: lib(ApplicationModule),
    map: (c) => ({ props: { name: p(c.resource).name } }),
  },
  page: {
    component: lib(Page),
    map: (c) => ({ props: { path: p(c.resource).path, title: p(c.resource).title } }),
  },

  /* Generic layout + text (plain HTML, no library component). */
  box: {
    map: (c) => ({
      children: (
        <div className={p(c.resource).className as string | undefined}>
          {c.slot()}
        </div>
      ),
    }),
  },
  form: {
    map: (c) => ({
      children: (
        <form
          className={p(c.resource).className as string | undefined}
          onSubmit={(e) => e.preventDefault()}
        >
          {c.slot()}
        </form>
      ),
    }),
  },
  heading: {
    map: (c) => {
      const { level, text, className } = p(c.resource);
      const Tag = (level === 1 ? "h1" : "h2") as "h1" | "h2";
      return { children: <Tag className={className as string | undefined}>{text as ReactNode}</Tag> };
    },
  },
  text: {
    map: (c) => ({
      children: (
        <p className={p(c.resource).className as string | undefined}>
          {p(c.resource).text as ReactNode}
        </p>
      ),
    }),
  },
  span: {
    map: (c) => ({
      children: (
        <span className={p(c.resource).className as string | undefined}>
          {p(c.resource).text as ReactNode}
        </span>
      ),
    }),
  },
  separator: { component: lib(Separator) },

  /* Cards. */
  card: {
    component: lib(Card),
    map: (c) => {
      const header = c.slot("header");
      const body = c.slot("body");
      return {
        children: (
          <>
            {header && <Card.Header>{header}</Card.Header>}
            {body && <Card.Body>{body}</Card.Body>}
          </>
        ),
      };
    },
  },
  "card-title": {
    component: lib(Card.Title),
    map: (c) => ({ children: p(c.resource).text as ReactNode }),
  },
  "card-description": {
    component: lib(Card.Description),
    map: (c) => ({ children: p(c.resource).text as ReactNode }),
  },

  /** A self-contained metric tile: a Card with label / value / badge. */
  metric: {
    component: lib(Card),
    map: (c) => {
      const { label, value, badge } = p(c.resource);
      return {
        children: (
          <Card.Body className="space-y-2">
            <div className="text-ui-sm text-ui-text-muted">{label as ReactNode}</div>
            <div className="flex items-center gap-2">
              <span className="text-ui-xl font-ui-semibold">{value as ReactNode}</span>
              <Badge>{badge as ReactNode}</Badge>
            </div>
          </Card.Body>
        ),
      };
    },
  },

  /* Display widgets. */
  badge: {
    component: lib(Badge),
    map: (c) => ({
      props: { variant: p(c.resource).variant },
      children: p(c.resource).text as ReactNode,
    }),
  },
  button: {
    component: lib(Button),
    map: (c) => {
      const { variant, size, label, type, ariaLabel } = p(c.resource);
      return {
        props: { variant, size, type, "aria-label": ariaLabel },
        children: label as ReactNode,
      };
    },
  },
  avatar: {
    map: (c) => ({
      children: (
        <Avatar>
          <Avatar.Fallback>{p(c.resource).fallback as ReactNode}</Avatar.Fallback>
        </Avatar>
      ),
    }),
  },
  tooltip: {
    map: (c) => {
      const { triggerLabel, ariaLabel, content, triggerVariant, triggerSize } = p(c.resource);
      return {
        children: (
          <Tooltip>
            <Tooltip.Trigger asChild>
              <Button
                variant={triggerVariant as Variant}
                size={triggerSize as Size}
                aria-label={ariaLabel as string | undefined}
              >
                {triggerLabel as ReactNode}
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content arrow>{content as ReactNode}</Tooltip.Content>
          </Tooltip>
        ),
      };
    },
  },
  progress: {
    component: lib(Progress),
    map: (c) => {
      const { value, indicatorProps } = p(c.resource);
      return { props: { value, indicatorProps } };
    },
  },
  skeleton: { component: lib(Skeleton) },

  /* Form widgets. */
  label: {
    component: lib(Label),
    map: (c) => ({
      props: { htmlFor: p(c.resource).htmlFor },
      children: c.slot() ?? (p(c.resource).text as ReactNode),
    }),
  },
  input: {
    component: lib(Input),
    map: (c) => {
      const { id, defaultValue, placeholder } = p(c.resource);
      return { props: { id, defaultValue, placeholder } };
    },
  },
  textarea: {
    component: lib(Textarea),
    map: (c) => {
      const { id, placeholder } = p(c.resource);
      return { props: { id, placeholder } };
    },
  },
  switch: {
    component: lib(Switch),
    map: (c) => ({ props: { defaultChecked: p(c.resource).defaultChecked } }),
  },
  checkbox: {
    component: lib(Checkbox),
    map: (c) => ({ children: (p(c.resource).text ?? "✓") as ReactNode }),
  },
  slider: {
    component: lib(Slider),
    map: (c) => {
      const { defaultValue, max, step } = p(c.resource);
      return { props: { defaultValue, max, step } };
    },
  },
  select: {
    map: (c) => {
      const { options, defaultValue, placeholder, ariaLabel } = p(c.resource);
      return {
        children: (
          <SelectField
            options={options as Option[]}
            defaultValue={defaultValue as string | undefined}
            placeholder={placeholder as string | undefined}
            aria-label={ariaLabel as string | undefined}
          />
        ),
      };
    },
  },
  "radio-group": {
    map: (c) => {
      const { legend, options, defaultValue } = p(c.resource);
      return {
        children: (
          <RadioGroupField
            legend={legend as string}
            options={options as Option[]}
            defaultValue={defaultValue as string | undefined}
          />
        ),
      };
    },
  },
  dialog: {
    map: (c) => {
      const r = p(c.resource);
      return {
        children: (
          <ConfirmDialog
            triggerLabel={r.triggerLabel as string}
            triggerVariant={r.triggerVariant as Variant}
            triggerClassName={r.triggerClassName as string | undefined}
            title={r.title as string}
            description={r.description as string}
            cancelLabel={r.cancelLabel as string}
            confirmLabel={r.confirmLabel as string}
            confirmVariant={r.confirmVariant as Variant}
          />
        ),
      };
    },
  },

  /* Tabs. */
  tabs: {
    component: lib(Tabs),
    map: (c) => ({ props: { defaultValue: p(c.resource).defaultValue } }),
  },
  "tabs-list": { component: lib(Tabs.List) },
  "tabs-trigger": {
    component: lib(Tabs.Trigger),
    map: (c) => ({ props: { value: p(c.resource).value }, children: p(c.resource).label as ReactNode }),
  },
  "tabs-content": {
    component: lib(Tabs.Content),
    map: (c) => ({ props: { value: p(c.resource).value } }),
  },

  /* Workflow (state-machine stepper). */
  "workflow-root": {
    component: lib(Workflow.Root),
    map: (c) => ({ props: { defaultValue: p(c.resource).defaultValue } }),
  },
  "workflow-steps": { component: lib(Workflow.Steps) },
  "workflow-step": {
    component: lib(Workflow.Step),
    map: (c) => ({ props: { value: p(c.resource).value }, children: p(c.resource).label as ReactNode }),
  },
  "workflow-panel": {
    component: lib(Workflow.Panel),
    map: (c) => ({ props: { value: p(c.resource).value } }),
  },
  "workflow-next": {
    component: lib(Workflow.Next),
    map: (c) => ({ children: p(c.resource).label as ReactNode }),
  },
  "workflow-previous": {
    component: lib(Workflow.Previous),
    map: (c) => ({ children: p(c.resource).label as ReactNode }),
  },

  /* Machine (headless XState parts). `machine-root` binds the JSON machine named
     by its `machine` prop (a key in `dna.machines`); `machine-state` /
     `machine-send` read that actor from context. */
  "machine-root": {
    component: lib(MachineRoot),
    map: (c) => {
      const machineId = p(c.resource).machine as string;
      return { props: { machineId, config: c.machine(machineId) } };
    },
  },
  "machine-state": {
    component: lib(Machine.State),
    map: (c) => ({ props: { match: p(c.resource).match } }),
  },
  "machine-send": {
    component: lib(MachineSend),
    map: (c) => {
      const { event, variant, label, requires } = p(c.resource);
      return { props: { event, variant, label, requires } };
    },
  },
  "flow-steps": {
    map: (c) => ({ children: <FlowSteps steps={p(c.resource).steps as Option[]} /> }),
  },
  "item-list": {
    map: (c) => ({ children: <ItemList items={p(c.resource).items as string[]} /> }),
  },
  nav: {
    map: (c) => ({ children: <NavList items={p(c.resource).items as string[]} /> }),
  },
};
