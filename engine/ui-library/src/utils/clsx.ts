export type ClassValue = string | number | false | null | undefined;

/**
 * Tiny classname joiner — keeps the library dependency-free. Filters out
 * falsy values so conditional classes read cleanly at the call site.
 */
export function clsx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
