#!/usr/bin/env node
/**
 * One-shot codemod: migrate an Operational DNA document from the nested
 * domain-containment shape to the flat home-edge shape.
 *
 *   - Flattens the `domain` tree: the root stays in `domain` (thin); every
 *     descendant domain becomes a flat `domains[]` entry naming its `parent`.
 *   - Hoists each domain's `resources`/`persons`/`roles`/`groups` to the
 *     document top level, stamping each with `domain: <home domain name>`.
 *   - Drops authored `path` from the root domain (it is a derived cache).
 *
 * Usage: node scripts/migrate-domain-home.mjs <file.json> [<file.json> ...]
 * Edits files in place. Idempotent on already-migrated documents.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const NOUNS = ['resources', 'persons', 'roles', 'groups']

function migrate(doc) {
  if (!doc || typeof doc !== 'object' || !doc.domain) return doc
  const out = { ...doc }
  const topNouns = { resources: [], persons: [], roles: [], groups: [] }
  const descendants = []

  // Seed top-level nouns with any already-hoisted ones (idempotence).
  for (const k of NOUNS) for (const n of doc[k] ?? []) topNouns[k].push(n)
  for (const d of doc.domains ?? []) descendants.push(d)

  const walk = (domain, parent) => {
    const { domains: kids, resources, persons, roles, groups, ...rest } = domain
    const homeName = rest.name
    for (const k of NOUNS) {
      for (const item of domain[k] ?? []) {
        topNouns[k].push(item.domain ? item : { ...item, domain: homeName })
      }
    }
    if (parent === null) {
      // Root: keep as the thin `domain`, drop authored path (derived cache).
      const { path: _drop, ...thinRoot } = rest
      void _drop
      out.domain = thinRoot
    } else {
      const { path: _p, ...thinRest } = rest
      void _p
      descendants.push({ ...thinRest, parent })
    }
    for (const kid of kids ?? []) walk(kid, homeName)
  }
  walk(doc.domain, null)

  if (descendants.length) out.domains = descendants
  for (const k of NOUNS) {
    if (topNouns[k].length) out[k] = topNouns[k]
    else delete out[k]
  }

  // Re-key so document reads: domain, domains, nouns, then activities.
  const ordered = {}
  ordered.domain = out.domain
  if (out.domains) ordered.domains = out.domains
  for (const k of NOUNS) if (out[k]) ordered[k] = out[k]
  for (const [k, v] of Object.entries(out)) {
    if (k === 'domain' || k === 'domains' || NOUNS.includes(k)) continue
    ordered[k] = v
  }
  return ordered
}

for (const file of process.argv.slice(2)) {
  const doc = JSON.parse(readFileSync(file, 'utf-8'))
  writeFileSync(file, JSON.stringify(migrate(doc), null, 2) + '\n')
  console.log('migrated', file)
}
