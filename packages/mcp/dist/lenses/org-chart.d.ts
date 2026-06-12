import type { DnaDataStore } from '@dna-codes/dna-core';
export interface OrgChartPerson {
    name: string;
    id: string;
}
export interface OrgChartNode {
    id: string;
    name: string;
    type: string;
    description?: string;
    holders: OrgChartPerson[];
    reports: OrgChartNode[];
    parentId?: string;
}
export interface OrgChartViewModel {
    lens: 'org-chart';
    groupName: string;
    roots: OrgChartNode[];
}
export declare function buildOrgChart(store: DnaDataStore): Promise<OrgChartViewModel>;
//# sourceMappingURL=org-chart.d.ts.map