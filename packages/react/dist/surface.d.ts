import { ReactNode } from 'react';
type SurfaceProps = {
    /** The structural product node's id (App/Module/Workflow/Page). */
    id: string;
    children: ReactNode;
    fallback?: ReactNode;
    loading?: ReactNode;
};
/**
 * The **coarse** product-UI gate. `<Surface>` renders its children only when
 * the current user can `can_access` the structural surface `id` (resolved
 * against the `access` snapshot on `<DnaProvider>`, cascading down `contains`).
 * An unreachable surface is not rendered at all — distinct from `<Operation>`,
 * the **fine** gate that disables individual controls *within* a rendered
 * surface. Both grains compose: nest `<Operation>` inside `<Surface>`.
 */
export declare function Surface({ id, children, fallback, loading: loadingNode }: SurfaceProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=surface.d.ts.map