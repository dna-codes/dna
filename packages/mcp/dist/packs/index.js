"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PACK = exports.PACKS = void 0;
exports.renderPackForPrompt = renderPackForPrompt;
const operational = __importStar(require("./operational.js"));
const crm = __importStar(require("./crm.js"));
const hr = __importStar(require("./hr.js"));
exports.PACKS = {
    operational: {
        name: 'operational',
        label: 'Operational',
        description: 'People, positions, departments, and processes. For org structure, reporting chains, and workflow mapping.',
        resourceTypes: operational.resourceTypes,
        relationshipTypes: operational.relationshipTypes,
    },
    crm: {
        name: 'crm',
        label: 'CRM',
        description: 'Contacts, accounts, opportunities, and deals. For sales pipelines and customer relationship tracking.',
        resourceTypes: crm.resourceTypes,
        relationshipTypes: crm.relationshipTypes,
    },
    hr: {
        name: 'hr',
        label: 'HR',
        description: 'Employees, roles, teams, and job postings. For people-ops, headcount planning, and recruitment.',
        resourceTypes: hr.resourceTypes,
        relationshipTypes: hr.relationshipTypes,
    },
};
exports.DEFAULT_PACK = 'operational';
/**
 * Render a pack's real type definitions as a structured prompt block. This is
 * the single source of truth for the agent's pack vocabulary — it reads the
 * same `PackDefinition` used to seed the store, so the prompt can never drift
 * from what is registered. Resource types render as `name · category — desc`;
 * relationship types as `name · from→to · cardinality — desc`, mirroring the
 * shape of the reference example documents.
 */
function renderPackForPrompt(packName) {
    const pack = exports.PACKS[packName] ?? exports.PACKS[exports.DEFAULT_PACK];
    const resourceLines = pack.resourceTypes
        .map(rt => `- **${rt.name}** · _${rt.category}_ — ${rt.description ?? ''}`.trimEnd())
        .join('\n');
    const relationshipLines = pack.relationshipTypes
        .map(rel => `- **${rel.name}** · ${rel.from}→${rel.to} · ${rel.cardinality} — ${rel.description ?? ''}`.trimEnd())
        .join('\n');
    return [
        `### ${pack.label} pack — ${pack.description}`,
        '',
        '**Resource types** (use these exact names as the `type` on add_instance):',
        resourceLines,
        '',
        '**Relationship types** (use these exact names as the `type` on add_link; respect the from→to endpoints):',
        relationshipLines,
    ].join('\n');
}
//# sourceMappingURL=index.js.map