import { createSemanticElement } from "../../utils/createSemanticElement";
import type { SemanticElementProps } from "../../utils/createSemanticElement";

export type ContainerProps = SemanticElementProps;

/**
 * A deliberately generic, non-landmark layout box. Renders a plain `<div>` and
 * carries no semantics of its own — the escape hatch for arbitrary nesting and
 * org-specific composition inside a `Page`. Reach for the named structural
 * components (`Header`, `Sidebar`, `Footer`, `Page`) when the region has real
 * landmark meaning; use `Container` when it does not.
 */
export const Container = createSemanticElement("Container", "div", "data-ui-container");
