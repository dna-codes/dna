import { createContext, forwardRef, useContext, useEffect, useMemo } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { Slot } from "radix-ui";

export interface PageContextValue {
  /** The route path this page represents, if provided. */
  path?: string;
  /** The page's title, if provided. */
  title?: string;
}

const PageContext = createContext<PageContextValue | null>(null);

/**
 * Read the nearest `Page`'s context (path/title), or `null` when not inside a
 * page. Non-throwing so it can be called from anywhere.
 */
export function usePage(): PageContextValue | null {
  return useContext(PageContext);
}

export interface PageProps extends HTMLAttributes<HTMLElement> {
  /**
   * The route path this page represents. Exposed via `usePage()`. `Page` is
   * deliberately **router-agnostic** — it never imports a router; pass routing
   * metadata in as props.
   */
  path?: string;
  /**
   * The page title. When set, it updates `document.title` and names the
   * `<main>` landmark (via `aria-label`).
   */
  title?: string;
  /**
   * Merge props onto the single child element instead of rendering a `<main>`.
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * A single route's primary content — the **one** `<main>` landmark per route.
 * Chrome (`Header`, `Sidebar`, `Footer`) lives in the surrounding shell as
 * siblings, never inside `Page`.
 *
 * It is router-agnostic (takes `path`/`title` as props), syncs `document.title`
 * when `title` is set, and is focusable (`tabIndex={-1}`) so consumers can move
 * focus here on navigation. All defaults are overridable via props.
 */
export const Page = forwardRef<HTMLElement, PageProps>(function Page(
  { path, title, asChild = false, children, ...rest },
  ref,
) {
  useEffect(() => {
    if (title !== undefined) document.title = title;
  }, [title]);

  const ctx = useMemo<PageContextValue>(() => ({ path, title }), [path, title]);
  const Comp = asChild ? Slot.Root : "main";

  return (
    <PageContext.Provider value={ctx}>
      <Comp
        ref={ref}
        tabIndex={-1}
        aria-label={title}
        data-ui-page=""
        {...rest}
      >
        {children}
      </Comp>
    </PageContext.Provider>
  );
});
