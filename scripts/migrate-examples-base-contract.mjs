#!/usr/bin/env node
// One-shot migration: stamp every Operational primitive in examples/*/operational.json
// with the base contract (`id`, `type`, `version`). Reads versions.json from
// @dna-codes/dna-schemas to pick the current per-type version. Idempotent —
// re-running on already-stamped files is a no-op.

import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const VERSIONS = JSON.parse(
  readFileSync(join(REPO_ROOT, 'packages/schemas/operational/versions.json'), 'utf8'),
)

function deriveName(type, p) {
  if (p.name) return p.name
  const pascalize = (s) => String(s).replace(/[^a-zA-Z0-9]/g, '').replace(/^./, c => c.toUpperCase())
  if (type === 'trigger') {
    const target = p.operation || p.process || 'Unknown'
    const source = pascalize(p.source || 'unknown')
    return pascalize(target) + source
  }
  if (type === 'rule') {
    const op = pascalize(p.operation || 'Unknown')
    const sub = pascalize(p.rule_type || 'rule')
    return op + sub
  }
  return undefined
}

function stamp(type, p) {
  if (!p || typeof p !== 'object') return p
  if (p.id && p.type && p.version && p.name) return p
  const out = {
    id: p.id ?? randomUUID(),
    type: p.type ?? type,
    version: p.version ?? VERSIONS[type] ?? '1',
    ...p,
  }
  if (!out.name) {
    const synth = deriveName(type, p)
    if (synth) out.name = synth
  }
  return out
}

function stampList(type, arr) {
  return Array.isArray(arr) ? arr.map((p) => stamp(type, p)) : arr
}

function walkDomain(d) {
  if (!d || typeof d !== 'object') return d
  const out = { ...d }
  if (d.resources) out.resources = stampList('resource', d.resources)
  if (d.persons) out.persons = stampList('person', d.persons)
  if (d.roles) out.roles = stampList('role', d.roles)
  if (d.groups) out.groups = stampList('group', d.groups)
  if (Array.isArray(d.domains)) out.domains = d.domains.map(walkDomain)
  return out
}

function migrate(doc) {
  const out = { ...doc }
  if (doc.domain) out.domain = walkDomain(doc.domain)
  if (doc.memberships) out.memberships = stampList('membership', doc.memberships)
  if (doc.operations) out.operations = stampList('operation', doc.operations)
  if (doc.triggers) out.triggers = stampList('trigger', doc.triggers)
  if (doc.rules) out.rules = stampList('rule', doc.rules)
  if (doc.relationships) out.relationships = stampList('relationship', doc.relationships)
  if (doc.tasks) out.tasks = stampList('task', doc.tasks)
  if (doc.processes) out.processes = stampList('process', doc.processes)
  return out
}

const examplesDir = join(REPO_ROOT, 'examples')
const dirs = readdirSync(examplesDir).filter((d) =>
  statSync(join(examplesDir, d)).isDirectory(),
)

for (const dir of dirs) {
  const file = join(examplesDir, dir, 'operational.json')
  try {
    const raw = readFileSync(file, 'utf8')
    const doc = JSON.parse(raw)
    const migrated = migrate(doc)
    writeFileSync(file, JSON.stringify(migrated, null, 2) + '\n')
    console.log('migrated', file)
  } catch (e) {
    if (e.code === 'ENOENT') continue
    throw e
  }
}
