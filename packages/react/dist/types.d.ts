import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core';
import type React from 'react';
export type AuditEvent = {
    operation: string;
    resource: string;
    action: string;
    userId: string;
    timestamp: string;
    permitted: boolean;
    payload?: unknown;
};
export type RoleResolver = (userId: string) => string[] | Promise<string[]>;
export type FlagResolver = (operationName: string) => boolean | Promise<boolean>;
export type DnaContextValue = {
    permitted: (opName: string) => boolean;
    perform: (opName: string, payload?: unknown) => Promise<{
        permitted: boolean;
    }>;
    loading: boolean;
    resolveFlag: (opName: string) => boolean | Promise<boolean>;
};
export type DnaProviderProps = {
    dna: OperationalDNA;
    userId: string;
    children: React.ReactNode;
    roles?: string[];
    resolveRoles?: RoleResolver;
    store?: DnaDataStore;
    onAudit?: (event: AuditEvent) => void | Promise<void>;
    flags?: FlagResolver;
};
//# sourceMappingURL=types.d.ts.map