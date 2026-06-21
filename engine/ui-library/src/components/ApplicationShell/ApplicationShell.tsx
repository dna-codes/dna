import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Slot } from "radix-ui";
import { Application } from "../Application/Application";
import type { ApplicationProps } from "../Application/Application";
import { Header } from "../Header/Header";
import { Sidebar } from "../Sidebar/Sidebar";
import type { SidebarProps } from "../Sidebar/Sidebar";
import { Page } from "../Page/Page";
import type { PageProps } from "../Page/Page";

/** Props shared by the structural `ApplicationShell.*` wrapper parts. */
export interface ApplicationShellProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export type ApplicationShellRootProps = ApplicationProps;
export type ApplicationShellHeaderProps = HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
};
export type ApplicationShellBodyProps = ApplicationShellProps;
export type ApplicationShellSidebarProps = SidebarProps;
export type ApplicationShellMainProps = PageProps;

/**
 * `ApplicationShell` is the standard full-page chrome arrangement composed from
 * the structural primitives: `Application` wrapping a top `Header` (the `banner`)
 * and a `Body` row that lays a `Sidebar` rail beside the routed `Main` (`Page`,
 * the single `<main>`).
 *
 * It is a **convenience composition**, not a new primitive — it makes only the
 * layout decision (header on top, sidebar beside main) and bakes in **no**
 * content. Every slot is a real primitive underneath and supports `asChild`, so
 * consumers keep full control of the brand, nav, and page content and can drop
 * down to the raw primitive at any point.
 *
 * ```tsx
 * <ApplicationShell.Root>
 *   <ApplicationShell.Header>
 *     <Header.Brand>DNA.codes</Header.Brand>
 *     <Header.Actions><Avatar>…</Avatar></Header.Actions>
 *   </ApplicationShell.Header>
 *   <ApplicationShell.Body>
 *     <ApplicationShell.Sidebar asChild>
 *       <NavRail.Root>…</NavRail.Root>
 *     </ApplicationShell.Sidebar>
 *     <ApplicationShell.Main title="Resources">
 *       <PageHeader.Root>…</PageHeader.Root>
 *     </ApplicationShell.Main>
 *   </ApplicationShell.Body>
 * </ApplicationShell.Root>
 * ```
 */
const Root = forwardRef<HTMLDivElement, ApplicationShellRootProps>(
  function ApplicationShell({ children, ...rest }, ref) {
    return (
      <Application ref={ref} data-ui-app-shell="" {...rest}>
        {children}
      </Application>
    );
  },
);

const ShellHeader = forwardRef<HTMLElement, ApplicationShellHeaderProps>(
  function ApplicationShellHeader(props, ref) {
    return <Header.Root ref={ref} {...props} />;
  },
);

const Body = forwardRef<HTMLDivElement, ApplicationShellBodyProps>(
  function ApplicationShellBody({ asChild = false, className, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "div";
    return (
      <Comp
        ref={ref}
        className={className}
        data-ui-app-shell-body=""
        {...rest}
      />
    );
  },
);

const ShellSidebar = forwardRef<HTMLElement, ApplicationShellSidebarProps>(
  function ApplicationShellSidebar(props, ref) {
    return <Sidebar ref={ref} {...props} />;
  },
);

const Main = forwardRef<HTMLElement, ApplicationShellMainProps>(
  function ApplicationShellMain(props, ref) {
    return <Page ref={ref} {...props} />;
  },
);

Root.displayName = "ApplicationShell";
ShellHeader.displayName = "ApplicationShell.Header";
Body.displayName = "ApplicationShell.Body";
ShellSidebar.displayName = "ApplicationShell.Sidebar";
Main.displayName = "ApplicationShell.Main";

/**
 * Compound, headless full-page chrome composition. Compose the namespaced parts;
 * the parts under `Header`/`Sidebar`/`Main` are the real primitives.
 */
export const ApplicationShell = {
  Root,
  Header: ShellHeader,
  Body,
  Sidebar: ShellSidebar,
  Main,
};
