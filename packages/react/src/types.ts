import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core'
import type React from 'react'

export type AuditEvent = {
  operation: string
  resource:  string
  action:    string
  userId:    string
  timestamp: string
  permitted: boolean
  payload?:  unknown
}

export type RoleResolver = (userId: string) => string[] | Promise<string[]>

export type FlagResolver = (operationName: string) => boolean | Promise<boolean>

/**
 * A snapshot of the `can_access` + `contains` edges that drive the coarse
 * structural-access gate. Mirrors `StructuralAccessGraph` in `@dna-codes/dna-core`;
 * an app produces it (server-side via the core resolver, or from the graph store)
 * and hands it to `<DnaProvider access=…>`. `subject` is a Role name or a User id.
 */
export type StructuralAccess = {
  grants:   { subject: string; surface: string }[]
  contains: { parent: string;  child: string }[]
}

export type DnaContextValue = {
  permitted:   (opName: string) => boolean
  perform:     (opName: string, payload?: unknown) => Promise<{ permitted: boolean }>
  loading:     boolean
  resolveFlag: (opName: string) => boolean | Promise<boolean>
  /** Coarse gate: is the structural surface reachable for the current user? */
  reachable:   (surfaceId: string) => boolean
}

export type DnaProviderProps = {
  dna:      OperationalDNA
  userId:   string
  children: React.ReactNode

  // Role resolution — provide exactly one
  roles?:        string[]
  resolveRoles?: RoleResolver
  store?:        DnaDataStore

  // Coarse structural-access gate (the `<Surface>` gate). When omitted, every
  // surface is reachable — the coarse gate is opt-in and never narrows an app
  // that does not author `can_access`.
  access?: StructuralAccess

  // Pluggable sinks
  onAudit?: (event: AuditEvent) => void | Promise<void>
  flags?:   FlagResolver
}
