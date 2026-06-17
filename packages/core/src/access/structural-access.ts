/**
 * Coarse structural-access resolution — the *coarse* grain of the two-grain
 * product-UI gate doctrine (see `openspec/specs/product-ui-governance`).
 *
 * `can_access` edges grant a Role or User access to a structural product
 * surface (App/Module/Workflow/Page). Access **cascades down** the `contains`
 * hierarchy: a grant on an App reaches its contained Modules/Pages, and a more
 * specific `can_access` on a contained node *overrides* the inherited grant
 * (widening or narrowing). The default is deny — a surface with no grant
 * anywhere up its containment chain is hidden.
 *
 * This module is pure (no graph store, no `fs`), so it is the canonical
 * statement of the doctrine and runs in any context. The browser-side gate in
 * `@dna-codes/dna-react` mirrors this logic inline to stay bundle-light.
 */

/** A snapshot of the governance + containment edges the resolver walks. */
export interface StructuralAccessGraph {
  /** `can_access` edges: a subject (Role name or User id) → a surface id. */
  grants: ReadonlyArray<{ subject: string; surface: string }>
  /** `contains` edges: a parent surface id → a child surface id. */
  contains: ReadonlyArray<{ parent: string; child: string }>
}

/**
 * True iff `surfaceId` is reachable for any of `subjects` (the current user id
 * plus their role names).
 *
 * A surface that carries its own `can_access` grants is decided solely by those
 * grants — an explicit grant set overrides inheritance, so a nested node can
 * widen *or* narrow what it inherits. A surface with no grants of its own
 * inherits its nearest ancestor's decision via `contains`. A surface with no
 * grant anywhere up its chain is denied.
 */
export function resolveStructuralAccess(
  graph: StructuralAccessGraph,
  surfaceId: string,
  subjects: readonly string[],
): boolean {
  const subjectSet = new Set(subjects)
  const parentOf = (id: string): string | undefined =>
    graph.contains.find((e) => e.child === id)?.parent
  const grantsOn = (id: string) => graph.grants.filter((g) => g.surface === id)

  const seen = new Set<string>()
  let cur: string | undefined = surfaceId
  while (cur !== undefined && !seen.has(cur)) {
    seen.add(cur)
    const here = grantsOn(cur)
    if (here.length > 0) {
      // An explicit grant set on this node decides — no further inheritance.
      return here.some((g) => subjectSet.has(g.subject))
    }
    cur = parentOf(cur)
  }
  return false
}

// ── Empty-surface lint ───────────────────────────────────────────────────────

/** Inputs for {@link lintEmptySurfaces}. */
export interface EmptySurfaceLintInput {
  /** Role-based `can_access` grants to check: a role name → a surface id. */
  grants: ReadonlyArray<{ subject: string; surface: string }>
  /** Operations a surface exposes directly: a surface id → an operation name. */
  surfaceOperations: ReadonlyArray<{ surface: string; operation: string }>
  /**
   * Operation-level access allow-entries: an operation → a role permitted to
   * perform it. An operation with no entries is performable by everyone (this
   * mirrors the operation gate: no access rule ⇒ permitted).
   */
  operationAllows: ReadonlyArray<{ operation: string; role: string }>
  /** `contains` edges, so a surface's operations roll up from contained nodes. */
  contains?: ReadonlyArray<{ parent: string; child: string }>
}

/** A flagged grant: a role can reach a surface but can perform none of its operations. */
export interface EmptySurfaceWarning {
  subject: string
  surface: string
  message: string
}

/**
 * Flag every role-based `can_access` grant to a surface that exposes at least
 * one operation the role can never perform *all of* — i.e. the role is granted
 * a surface with no usable actions (a "coarse access, no fine access"
 * contradiction). Surfaces that expose no operations at all are not flagged
 * (they may be deliberately `planned`/empty). Pure.
 */
export function lintEmptySurfaces(input: EmptySurfaceLintInput): EmptySurfaceWarning[] {
  const childrenOf = (id: string): string[] =>
    (input.contains ?? []).filter((e) => e.parent === id).map((e) => e.child)

  /** Operations exposed at or under `surface`, rolling up the `contains` tree. */
  const opsUnder = (surface: string): Set<string> => {
    const out = new Set<string>()
    const seen = new Set<string>()
    const stack = [surface]
    while (stack.length) {
      const s = stack.pop()!
      if (seen.has(s)) continue
      seen.add(s)
      for (const so of input.surfaceOperations) if (so.surface === s) out.add(so.operation)
      for (const child of childrenOf(s)) stack.push(child)
    }
    return out
  }

  const allowsByOp = new Map<string, Set<string>>()
  for (const a of input.operationAllows) {
    if (!allowsByOp.has(a.operation)) allowsByOp.set(a.operation, new Set())
    allowsByOp.get(a.operation)!.add(a.role)
  }
  const canPerform = (role: string, op: string): boolean => {
    const allows = allowsByOp.get(op)
    return allows === undefined || allows.size === 0 || allows.has(role)
  }

  const warnings: EmptySurfaceWarning[] = []
  for (const g of input.grants) {
    const ops = opsUnder(g.surface)
    if (ops.size === 0) continue
    if (![...ops].some((op) => canPerform(g.subject, op))) {
      warnings.push({
        subject: g.subject,
        surface: g.surface,
        message: `Role "${g.subject}" is granted can_access to surface "${g.surface}" but cannot perform any of its ${ops.size} operation(s).`,
      })
    }
  }
  return warnings
}
