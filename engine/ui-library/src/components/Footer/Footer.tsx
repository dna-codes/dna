import { createSemanticElement } from "../../utils/createSemanticElement";
import type { SemanticElementProps } from "../../utils/createSemanticElement";

export type FooterProps = SemanticElementProps;

/**
 * The application/page footer. Renders a native `<footer>`, which maps to the
 * `contentinfo` landmark when it is a top-level region of the document (i.e.
 * not nested inside `<main>`, `<article>`, or `<section>`). Keep it in the
 * persistent shell, as a sibling of the `<main>` (`Page`), not inside it.
 */
export const Footer = createSemanticElement("Footer", "footer", "data-ui-footer");
