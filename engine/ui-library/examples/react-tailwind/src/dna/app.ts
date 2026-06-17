import type { DNA } from "../engine";
import { mergeDna } from "./merge";
import chrome from "./chrome.json";
import moduleOne from "./module-one.json";
import moduleTwo from "./module-two.json";
import moduleThree from "./module-three.json";
import moduleFour from "./module-four.json";

/**
 * The whole example app is **pure-JSON DNA**: each fragment lives in a `.json`
 * file and is merged here into one graph. There is no DNA authored in TypeScript
 * anymore — the `.ts` is only the glue that imports the JSON and concatenates it.
 *
 * - `chrome.json` — the structural spine (`application → tooltipProvider →
 *   [header, machine-root, footer]`), plus the `machines` (the `content` shell
 *   machine + the `session` access machine, in XState JSON) and the `access`
 *   policy (Users › Roles › Actions on Resources).
 * - `module-{one..four}.json` — the four modules wired into the page's content
 *   box (the chrome references `m1`..`m4`).
 *
 * JSON modules widen to plain types (e.g. `kind: string`), so each is cast
 * through `unknown` to `DNA`; the resolver still validates the graph at runtime.
 */
const asDna = (json: unknown) => json as DNA;

export const appDna: DNA = mergeDna(
  asDna(chrome),
  asDna(moduleOne),
  asDna(moduleTwo),
  asDna(moduleThree),
  asDna(moduleFour),
);
