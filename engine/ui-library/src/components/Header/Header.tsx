import { createSemanticElement } from "../../utils/createSemanticElement";
import type { SemanticElementProps } from "../../utils/createSemanticElement";

export type HeaderProps = SemanticElementProps;

/**
 * The application/page header. Renders a native `<header>`, which maps to the
 * `banner` landmark when it is a top-level region of the document (i.e. not
 * nested inside `<main>`, `<article>`, or `<section>`). Keep it in the
 * persistent shell, as a sibling of the `<main>` (`Page`), not inside it.
 */
export const Header = createSemanticElement("Header", "header", "data-ui-header");
