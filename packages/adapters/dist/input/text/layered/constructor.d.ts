import { type Conflict } from '@dna-codes/dna-core';
import { type EnumPools, type PrimitiveKind, type ToolDefinition } from '../tools/schema-to-tool';
export interface LayeredConstructorOptions {
    /**
     * Domain metadata wrapping the noun primitives. Defaults to `{ name: 'domain' }`.
     * The constructor never asks the LLM for this; it's set up-front so the model
     * can focus on primitives.
     */
    domain?: {
        name: string;
        path?: string;
        description?: string;
    };
    /**
     * Maximum total tool calls before the constructor throws. Default 50.
     */
    maxToolCalls?: number;
    /**
     * Maximum number of `finalize` retries (after a failed validation). Default 3.
     */
    maxFinalizeRetries?: number;
}
export interface ToolCallRequest {
    name: string;
    args: Record<string, unknown>;
}
export type ToolCallResult = {
    ok: true;
    finalized?: false;
    primitive?: PrimitiveKind;
    name?: string;
    message?: string;
    conflicts?: Conflict[];
} | {
    ok: true;
    finalized: true;
    document: Record<string, unknown>;
    conflicts: Conflict[];
} | {
    ok: false;
    error: 'unknown_tool' | 'duplicate_call' | 'schema_violation' | 'unknown_resource' | 'unknown_person' | 'unknown_role' | 'unknown_group' | 'unknown_operation' | 'unknown_target' | 'unknown_actor' | 'unknown_operator' | 'unknown_task' | 'unknown_process' | 'unknown_rule' | 'invalid_args' | 'iteration_cap_reached' | 'finalize_failed' | 'finalize_retries_exhausted';
    message: string;
    details?: unknown;
    available?: string[];
};
export interface LayeredResult {
    document: Record<string, unknown>;
    /** Composed-on-add conflicts accumulated across all `add_*` tool calls. */
    conflicts: Conflict[];
}
export declare class LayeredConstructor {
    private readonly tools_;
    private readonly maxToolCalls;
    private readonly maxFinalizeRetries;
    private dna;
    private readonly accumulatedConflicts;
    private readonly validator;
    private readonly transcript;
    private callCount;
    private finalizeAttempts;
    private lastCallSig;
    private finalized;
    constructor(options?: LayeredConstructorOptions);
    /** Tool definitions in a provider-neutral shape. */
    tools(): ToolDefinition[];
    /** Pools of declared primitive names — useful for narrowing tool schemas mid-flight. */
    pools(): EnumPools;
    /**
     * The assembled document plus any composed-on-add conflicts. The
     * `document` field matches the shape `cleanDocument()` used to return —
     * it's the merged DNA stripped of empty collections. The `conflicts`
     * field accumulates scalar disagreements across all `add_*` tool calls
     * (an LLM re-emitting the same primitive with conflicting scalars).
     */
    result(): LayeredResult;
    hasFinalized(): boolean;
    toolCallCount(): number;
    toolCallTranscript(): {
        name: string;
        args: Record<string, unknown>;
        result: ToolCallResult;
    }[];
    /** Process a tool call from the LLM (or any caller). Synchronous and side-effect-free on errors. */
    handle(call: ToolCallRequest): ToolCallResult;
    private recordCall;
    private handleAdd;
    /**
     * If a primitive with the given `kind` and `name` already exists in the
     * running DNA, return a copy of `args` with its `id` field set to the
     * existing id. Otherwise return `args` unchanged. Prevents merge() from
     * reporting a spurious id-scalar conflict when the same name is composed
     * twice (a supported pattern; only user-facing scalars should conflict).
     */
    private reuseExistingId;
    private findPrimitiveByName;
    private collectionFor;
    private validatePrimitive;
    private checkReferences;
    private handleFinalize;
}
//# sourceMappingURL=constructor.d.ts.map