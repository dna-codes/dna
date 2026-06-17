import { createSemanticElement } from "../../utils/createSemanticElement";
import type { SemanticElementProps } from "../../utils/createSemanticElement";

export type SidebarProps = SemanticElementProps;

/**
 * A complementary side region of the shell. Renders a native `<aside>`
 * (`complementary` landmark). When the sidebar's main purpose is navigation,
 * either render its links inside a nested `<nav>`, or swap the element with
 * `asChild` (e.g. `<Sidebar asChild><nav>…</nav></Sidebar>`).
 */
export const Sidebar = createSemanticElement("Sidebar", "aside", "data-ui-sidebar");
