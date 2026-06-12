import type { DnaDataStore } from '@dna-codes/dna-core';
export interface PositionEntry {
    id: string;
    name: string;
    person: string | null;
}
export interface PeoplePositionsViewModel {
    lens: 'people-positions';
    positions: PositionEntry[];
}
export declare function buildPeoplePositions(store: DnaDataStore): Promise<PeoplePositionsViewModel>;
//# sourceMappingURL=people-positions.d.ts.map