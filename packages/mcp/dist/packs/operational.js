"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relationshipTypes = exports.resourceTypes = void 0;
exports.resourceTypes = [
    { name: 'person', category: 'person', description: 'A human individual in the organization.', attribute_schema: [], stability: 'stable' },
    { name: 'position', category: 'role', description: 'A role or seat in the org structure, independent of who holds it.', attribute_schema: [], stability: 'stable' },
    { name: 'department', category: 'group', description: 'A functional division or team within the company.', attribute_schema: [], stability: 'stable' },
    { name: 'company', category: 'group', description: 'The top-level organization.', attribute_schema: [], stability: 'stable' },
    { name: 'process', category: 'resource', description: 'A named workflow or end-to-end business process.', attribute_schema: [], stability: 'stable' },
    { name: 'step', category: 'resource', description: 'A discrete unit of work within a process.', attribute_schema: [], stability: 'stable' },
];
exports.relationshipTypes = [
    { name: 'fills', from: 'person', to: 'position', cardinality: 'many-to-many', attribute: 'fills', description: 'A person occupies a position.', stability: 'stable' },
    { name: 'reports_to', from: 'position', to: 'position', cardinality: 'many-to-many', attribute: 'reports_to', description: 'A position reports to another position in the hierarchy.', stability: 'stable' },
    { name: 'belongs_to', from: '*', to: '*', cardinality: 'many-to-many', attribute: 'belongs_to', description: 'Generic containment: a node belongs to a parent container.', stability: 'stable' },
    { name: 'assigned_to', from: 'step', to: 'position', cardinality: 'many-to-many', attribute: 'assigned_to', description: 'A step is owned/executed by a position.', stability: 'stable' },
    { name: 'next_step', from: 'step', to: 'step', cardinality: 'many-to-many', attribute: 'next_step', description: 'A step flows into the next step in a process.', stability: 'stable' },
];
//# sourceMappingURL=operational.js.map