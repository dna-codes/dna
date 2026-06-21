import { createSemanticElement } from "../../utils/createSemanticElement";
import type { SemanticElementProps } from "../../utils/createSemanticElement";

export type InlineProps = SemanticElementProps;

/**
 * A horizontal layout box: lays its children out in a single row with the
 * system's control gap. The inline counterpart to `Container`. Use it for a
 * row of controls — a search field + submit button, a button group, an input
 * with a trailing action. A full-width control (e.g. `Input`) flexes to fill
 * the remaining space while fixed controls keep their natural width.
 */
export const Inline = createSemanticElement("Inline", "div", "data-ui-inline");
