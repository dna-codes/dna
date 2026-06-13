/**
 * TypeScript types for the Product UI behavioral layer primitives.
 *
 * These mirror the JSON Schemas under `@dna-codes/dna-schemas` at
 * `product/ui/*` and the additive fields on `product/web/page` and the
 * `product.ui` composite. They give consumers a typed handle on the full
 * UI hierarchy (Workflow -> Page -> Section -> Component -> Element) and the
 * behavioral `UIOperation` primitive (trigger + effects).
 */
import type { Stability } from './data-store';
/** A leaf UI primitive within a Component (input, button, label, …). */
export interface Element {
    name: string;
    type: 'input' | 'button' | 'label' | 'select' | 'checkbox' | 'link' | 'text' | 'image' | 'icon';
    description?: string;
    /** The Field on the parent Component's Resource this element binds to. */
    field?: string;
    stability?: Stability;
}
/** A reusable UI unit within a Section (card, table, form, …). */
export interface Component {
    name: string;
    type: 'card' | 'table' | 'form' | 'list' | 'detail' | 'actions' | 'chart' | 'banner';
    description?: string;
    resource?: string;
    /** The Operation this component maps from, as `Resource.Action`. */
    operation?: string;
    elements?: Element[];
    stability?: Stability;
}
/** A named structural region within a Page (header, main, sidebar, …). */
export interface Section {
    name: string;
    description?: string;
    role?: 'header' | 'main' | 'sidebar' | 'footer' | 'nav' | 'aside';
    components?: Component[];
    stability?: Stability;
}
/** A navigable grouping of Pages above the Page level — a user journey. */
export interface Workflow {
    name: string;
    description?: string;
    resource?: string;
    /** Pages in journey order, referenced by PascalCase name. */
    pages?: string[];
    stability?: Stability;
}
/** What sets a UIOperation off: a Component plus the user event on it. */
export interface UIOperationTrigger {
    component: string;
    event: 'click' | 'submit' | 'change' | 'load' | 'hover' | 'focus' | 'blur';
}
/** Navigate to a Page or route. */
export interface NavigateEffect {
    type: 'navigate';
    to: string;
}
/** Invoke a backend Operation, as `Resource.Action`. */
export interface ApiCallEffect {
    type: 'api-call';
    operation: string;
}
/** Update a piece of UI state. */
export interface StateChangeEffect {
    type: 'state-change';
    target: string;
    value?: unknown;
}
/** Render a Component. */
export interface RenderEffect {
    type: 'render';
    component: string;
}
export type UIOperationEffect = NavigateEffect | ApiCallEffect | StateChangeEffect | RenderEffect;
/**
 * A first-class behavioral primitive at the product UI layer: a trigger plus
 * an ordered list of effects describing what happens on user interaction.
 */
export interface UIOperation {
    id: string;
    name: string;
    description?: string;
    trigger: UIOperationTrigger;
    effects: UIOperationEffect[];
    stability?: Stability;
}
//# sourceMappingURL=product-ui.d.ts.map