/**
 * Pure operational→product **Permission** projection (governance).
 *
 * Derives reified product Permissions (and `grants` edges) from operational
 * Memberships + access Rules — the org→app authorization causal chain:
 *
 *   Membership(person → position → group)  --grants-->  Permission{principal, role, scope}
 *
 * Derivation rule (the "Atlas rule"): a Membership yields a Permission when its
 * Position is named by an access Rule (i.e. the Position can actually do
 * something in the app). The Permission's `principal` projects the Person, its
 * `role` projects the Position, and its `scope` is a namespaced entity reference
 * resolving to the Group. When the scope cannot be resolved (a multi-scope
 * Position with no disambiguating Group) the Permission is emitted `planned`
 * with no `grants` edge — never invented.
 *
 * Derive-first / author-fallback: this function derives only. Reconciliation of
 * a derived Permission onto a hand-authored one of the same `{principal, role,
 * scope}` identity happens at apply time (`applyPermissions`).
 *
 * Pure — writes nothing.
 */
import type { PermissionProjection } from './types';
interface PositionLike {
    name: string;
    scope?: string | string[];
}
interface MembershipLike {
    name: string;
    person: string;
    position: string;
    group?: string;
}
interface RuleLike {
    rule_type?: string;
    type?: string;
    allow?: {
        role?: string;
    }[];
}
export interface PermissionProjectionInput {
    positions?: PositionLike[];
    memberships?: MembershipLike[];
    rules?: RuleLike[];
}
export declare function permissionKey(principal: string, role: string, scope: string): string;
export declare function projectPermissions(op: PermissionProjectionInput): PermissionProjection;
export {};
//# sourceMappingURL=permissions.d.ts.map