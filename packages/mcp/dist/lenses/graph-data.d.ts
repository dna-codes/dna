import type { DnaDataStore } from '@dna-codes/dna-core';
export interface GraphNode {
    id: string;
    type: string;
    name: string;
}
export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: string;
}
export interface GraphDataViewModel {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
export declare function buildGraphData(store: DnaDataStore): Promise<GraphDataViewModel>;
//# sourceMappingURL=graph-data.d.ts.map