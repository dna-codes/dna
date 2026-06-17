import { createSemanticElement } from "../../utils/createSemanticElement";
import type { SemanticElementProps } from "../../utils/createSemanticElement";

export type ContentProps = SemanticElementProps;

/**
 * A presentational content region that lives inside a `Page`. Renders a plain
 * `<div>` and is intentionally **not** a landmark: the `Page` itself is the
 * single `<main>` for the route, so `Content` is just a composability box for
 * layout concerns (scroll area, padding, max-width). For arbitrary nesting with
 * no semantic intent, prefer `Container`.
 */
export const Content = createSemanticElement("Content", "div", "data-ui-content");
