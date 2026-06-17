import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { createMachine, useActorRef, useSelector } from "@dna/ui-library";
import type { AccessConfig, AccessRule, DNA, MachineJSON } from "./types";
import { useActorRegistry } from "./actorRegistry";
import { makeActivityInspect, useActivityLog } from "./activityLog";

/**
 * Authorization for the app, driven by the **actor reference**: the active actor
 * is the current state of an XState machine declared in the DNA, and `DNA.access`
 * holds the **Actor › Action › Resource** rules. `useAccess().can(...)` evaluates
 * them, and the engine hides any resource whose `meta.requires` action the actor
 * isn't permitted. Components can read the same hook for finer behavior (e.g.
 * disabling instead of hiding).
 *
 * This is **UX only**, never a security boundary — real authorization must be
 * enforced server-side.
 */
export type Access = {
  /** The active user's id (access machine's current state value), or `null`. */
  user: string | null;
  /** The active user's roles. */
  roles: string[];
  /** Whether the active user (via any of its roles) may do `action` on the resource. */
  can: (action: string, resourceId?: string, resourceType?: string) => boolean;
};

/** Default: no access config ⇒ everything is permitted (ungated). */
const AccessContext = createContext<Access>({
  user: null,
  roles: [],
  can: () => true,
});

/** Read the engine's access decision surface. */
export function useAccess(): Access {
  return useContext(AccessContext);
}

/** Does a Role › Action › Resource rule match this request? `*` is a wildcard. */
function ruleMatches(
  rule: AccessRule,
  roles: string[],
  action: string,
  resourceId?: string,
  resourceType?: string,
): boolean {
  const roleOk = rule.role === "*" || roles.includes(rule.role);
  const actionOk = rule.action === "*" || rule.action === action;
  const resourceOk =
    rule.resource === "*" ||
    rule.resource === resourceId ||
    (resourceType !== undefined && rule.resource === `type:${resourceType}`);
  return roleOk && actionOk && resourceOk;
}

/**
 * Wraps the engine in the access decision surface. With no `dna.access` it's a
 * pass-through (ungated). Otherwise it runs the access machine and projects its
 * current state into `Access`.
 */
export function AccessProvider({
  dna,
  children,
}: {
  dna: DNA;
  children: ReactNode;
}) {
  if (!dna.access) return <>{children}</>;
  return (
    <AccessRuntime access={dna.access} config={dna.machines?.[dna.access.machine]}>
      {children}
    </AccessRuntime>
  );
}

function AccessRuntime({
  access,
  config,
  children,
}: {
  access: AccessConfig;
  config: MachineJSON | undefined;
  children: ReactNode;
}) {
  // `config` is the access machine's JSON (looked up by id). Build it once.
  const machine = useMemo(
    () =>
      createMachine(
        (config ?? { states: {} }) as Parameters<typeof createMachine>[0],
      ),
    [config],
  );

  const log = useActivityLog();
  const inspect = useMemo(
    () => makeActivityInspect(log, access.machine),
    [log, access.machine],
  );
  const actorRef = useActorRef(machine, { inspect });

  // Register so the inspector lists the actor and its switches are audited.
  const registry = useActorRegistry();
  useEffect(
    () => registry?.register(access.machine, actorRef),
    [registry, access.machine, actorRef],
  );

  // The access machine's current state value is the active user's id.
  const user = useSelector(actorRef, (s) =>
    typeof s.value === "string" ? s.value : JSON.stringify(s.value),
  );
  const roles = useMemo(
    () => access.users.find((u) => u.id === user)?.roles ?? [],
    [access.users, user],
  );

  // Attribute every logged operation/interaction to the active user.
  useEffect(() => log?.setActor(user), [log, user]);

  const value = useMemo<Access>(
    () => ({
      user,
      roles,
      can: (action, resourceId, resourceType) =>
        access.rules.some((rule) =>
          ruleMatches(rule, roles, action, resourceId, resourceType),
        ),
    }),
    [user, roles, access],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}
