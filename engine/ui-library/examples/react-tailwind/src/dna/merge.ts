import type { DNA } from "../engine";

/** Concatenate DNA fragments into one graph (resources + relationships +
 *  machines + access policy). Machines from later fragments win on an id clash;
 *  the last fragment to declare `access` wins. */
export function mergeDna(...parts: DNA[]): DNA {
  return {
    resources: parts.flatMap((d) => d.resources),
    relationships: parts.flatMap((d) => d.relationships),
    machines: Object.assign({}, ...parts.map((d) => d.machines ?? {})),
    access: parts.reduce<DNA["access"]>((acc, d) => d.access ?? acc, undefined),
  };
}
