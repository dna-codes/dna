/**
 * Derive a Domain's `path` cache from the authoritative `parent` chain.
 *
 * Per the home-edge model (`grouping-model` doctrine), `path` is a derived
 * cache of the parent chain, never an authoritative field. This helper
 * regenerates it: it walks from the named domain up through `parent` links to
 * the rootless tenant, then joins the names root→leaf with `.`.
 *
 * - Any authored `path` on the domains is ignored — the chain governs.
 * - A cycle (or a `parent` that names a missing domain) is treated as the end
 *   of the chain, so the function always terminates and returns a best-effort
 *   path rather than throwing.
 */

import type { Domain } from '../types/operational'

/** A domain-like shape carrying the fields `derivePath` reads. */
export interface DomainLike {
  name: string
  parent?: string
}

/**
 * Compute the dot-separated path for `name` from the `parent` chain across
 * `domains`. Returns `name` alone when it has no parent (the tenant root), and
 * `''` when `name` is not among `domains`.
 */
export function derivePath(name: string, domains: ReadonlyArray<DomainLike | Domain>): string {
  const byName = new Map<string, DomainLike>()
  for (const d of domains) if (d && typeof d.name === 'string') byName.set(d.name, d)
  if (!byName.has(name)) return ''

  const segments: string[] = []
  const seen = new Set<string>()
  let current: string | undefined = name
  while (current && byName.has(current) && !seen.has(current)) {
    seen.add(current)
    segments.unshift(current)
    current = byName.get(current)!.parent
  }
  return segments.join('.')
}
