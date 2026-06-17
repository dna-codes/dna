// Public state-machine surface. The library adopts XState v5 as its engine and
// re-exports the authoring + React toolkit here, so consumers get everything
// from `@dna/ui-library` without a separate import. `xstate` / `@xstate/react`
// are externalized (see vite.config.ts) so a single instance is deduped.

// Authoring helpers (from `xstate`).
export {
  setup,
  createMachine,
  assign,
  fromPromise,
  fromCallback,
  fromObservable,
  fromTransition,
  createActor,
  raise,
  sendTo,
  enqueueActions,
} from "xstate";
export type {
  AnyStateMachine,
  AnyActorRef,
  ActorRefFrom,
  EventObject,
  StateValue,
  Snapshot,
} from "xstate";

// React bindings (from `@xstate/react`).
export {
  useMachine,
  useActor,
  useActorRef,
  useSelector,
  createActorContext,
} from "@xstate/react";

// The library's own headless engine pieces.
export {
  createSequenceMachine,
} from "./createSequenceMachine";
export type {
  SequenceContext,
  SequenceEvent,
  SequenceInput,
  SequenceMachine,
} from "./createSequenceMachine";
export {
  useDisclosureBinding,
  useValueBinding,
} from "./adapters";
export type {
  DisclosureBindingOptions,
  ValueBindingOptions,
} from "./adapters";

// The Machine context hooks (`useMachineActor` / `useMachineState`) ship via the
// `Machine` component barrel (`src/components/Machine`) to keep the names
// single-sourced in the top-level export.
