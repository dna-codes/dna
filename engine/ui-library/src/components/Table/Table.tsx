import { forwardRef } from "react";
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Slot } from "radix-ui";

/** Props shared by every `Table.*` part. */
export interface TableProps extends HTMLAttributes<HTMLElement> {
  /**
   * Merge props onto the single child element instead of rendering the default
   * element for this part.
   *
   * @see https://www.radix-ui.com/primitives/docs/guides/composition
   */
  asChild?: boolean;
}

export type TableHeaderProps = TableProps;
export type TableBodyProps = TableProps;
export type TableRowProps = TableProps;
export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  asChild?: boolean;
}
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  asChild?: boolean;
}

/**
 * A headless, unstyled data table. Radix has no table primitive, so it follows
 * the `Card` pattern: `Slot`-powered `asChild` parts that ship only
 * `data-ui-table-*` hooks plus forwarded `className`/`style`, over the correct
 * semantic elements (`table`/`thead`/`tbody`/`tr`/`th`/`td`). Compose the parts
 * directly, or drive it from data with a small map — it stays graph/JSON
 * friendly (e.g. a Product-UI `Component` of `type: "table"`).
 *
 * ```tsx
 * <Table.Root>
 *   <Table.Header><Table.Row><Table.HeaderCell>Name</Table.HeaderCell></Table.Row></Table.Header>
 *   <Table.Body>{rows.map(r => <Table.Row key={r.id}><Table.Cell>{r.name}</Table.Cell></Table.Row>)}</Table.Body>
 * </Table.Root>
 * ```
 */
const Root = forwardRef<HTMLTableElement, TableProps>(function Table(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "table";
  return <Comp ref={ref} className={className} data-ui-table="" {...rest} />;
});

const Header = forwardRef<HTMLTableSectionElement, TableHeaderProps>(function TableHeader(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "thead";
  return <Comp ref={ref} className={className} data-ui-table-header="" {...rest} />;
});

const Body = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "tbody";
  return <Comp ref={ref} className={className} data-ui-table-body="" {...rest} />;
});

const Row = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "tr";
  return <Comp ref={ref} className={className} data-ui-table-row="" {...rest} />;
});

const HeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(function TableHeaderCell(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "th";
  return <Comp ref={ref} className={className} data-ui-table-header-cell="" {...rest} />;
});

const Cell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { asChild = false, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "td";
  return <Comp ref={ref} className={className} data-ui-table-cell="" {...rest} />;
});

Root.displayName = "Table";
Header.displayName = "Table.Header";
Body.displayName = "Table.Body";
Row.displayName = "Table.Row";
HeaderCell.displayName = "Table.HeaderCell";
Cell.displayName = "Table.Cell";

/** Compound, headless data table. Compose with the namespaced parts. */
export const Table = {
  Root,
  Header,
  Body,
  Row,
  HeaderCell,
  Cell,
};
