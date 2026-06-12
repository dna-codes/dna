import type { DnaDataStore } from '@dna-codes/dna-core';
export interface AccountOpportunity {
    id: string;
    name: string;
    status: 'open' | 'closed';
}
export interface AccountEntry {
    id: string;
    name: string;
    owner: string | null;
    opportunities: AccountOpportunity[];
    activityCount: number;
}
export interface AccountsViewModel {
    lens: 'accounts';
    accounts: AccountEntry[];
}
export declare function buildAccounts(store: DnaDataStore): Promise<AccountsViewModel>;
//# sourceMappingURL=accounts.d.ts.map