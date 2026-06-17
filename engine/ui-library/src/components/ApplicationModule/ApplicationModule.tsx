import { createContext, forwardRef, useContext, useMemo } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { Slot } from "radix-ui";

export interface ApplicationModuleContextValue {
  /** The module's identifier, for nav highlighting / scoped logic. */
  id?: string;
  /** The module's human-readable name. */
  name?: string;
}

const ApplicationModuleContext =
  createContext<ApplicationModuleContextValue | null>(null);

/**
 * Read the nearest `ApplicationModule`'s context (id/name), or `null` when not
 * inside one. Non-throwing so navigation, breadcrumbs, etc. can call it from
 * anywhere in the tree.
 */
export function useApplicationModule(): ApplicationModuleContextValue | null {
  return useContext(ApplicationModuleContext);
}

export interface ApplicationModuleProps extends HTMLAttributes<HTMLElement> {
  /** Identifier for the module, exposed via context for nav/scoped logic. */
  id?: string;
  /**
   * Human-readable module name. When set, it both names the `region` landmark
   * (via `aria-label`) and is exposed through `useApplicationModule()`.
   */
  name?: string;
  /**
   * Merge props onto the single child element instead of rendering a
   * `<section>`.
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * A broad section of the application (e.g. "Billing", "Admin"). Renders a
 * `<section>` — which becomes a `region` landmark once it has an accessible
 * name — and provides its id/name to descendants via `useApplicationModule()`.
 * A module typically contains the route's `Page`(s); pages remain the single
 * `<main>`, so this region sits around (not inside) that `<main>`.
 */
export const ApplicationModule = forwardRef<HTMLElement, ApplicationModuleProps>(
  function ApplicationModule(
    { id, name, asChild = false, children, ...rest },
    ref,
  ) {
    const ctx = useMemo<ApplicationModuleContextValue>(
      () => ({ id, name }),
      [id, name],
    );
    const Comp = asChild ? Slot.Root : "section";

    return (
      <ApplicationModuleContext.Provider value={ctx}>
        <Comp
          ref={ref}
          aria-label={name}
          data-ui-application-module=""
          {...rest}
        >
          {children}
        </Comp>
      </ApplicationModuleContext.Provider>
    );
  },
);
