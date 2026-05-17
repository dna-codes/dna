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
exports.getMembershipsForPerson = exports.getMembershipsForRole = exports.getActorsForOperation = exports.getRulesForOperation = exports.getRules = exports.getRule = exports.getTriggersForOperation = exports.getTriggers = exports.getTasksForOperation = exports.getTasks = exports.getTask = exports.getTriggersForProcess = exports.getProcesses = exports.getProcess = exports.getOperationsForResource = exports.getOperations = exports.getOperation = exports.getMemberships = exports.getMembership = exports.getGroups = exports.getGroup = exports.getRoles = exports.getRole = exports.getPersons = exports.getPerson = exports.getResources = exports.getResource = exports.bookshopInput = exports.OPERATIONAL_PRIMITIVE_VERSIONS = exports.DEFAULT_STYLES = exports.merge = exports.addRelationship = exports.addProcess = exports.addTask = exports.addRule = exports.addTrigger = exports.addOperation = exports.addMembership = exports.addGroup = exports.addRole = exports.addPerson = exports.addResource = exports.createOperationalDna = exports.DnaValidator = exports.layerDirs = exports.documents = exports.schemas = exports.SCHEMA_ROOT = void 0;
exports.resolveSchemaFile = resolveSchemaFile;
exports.allSchemas = allSchemas;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.SCHEMA_ROOT = path.dirname(require.resolve('@dna-codes/dna-schemas/package.json'));
function load(rel) {
    const file = path.join(exports.SCHEMA_ROOT, rel);
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
exports.schemas = {
    operational: {
        action: load('operational/action.json'),
        attribute: load('operational/attribute.json'),
        base: load('operational/base.json'),
        domain: load('operational/domain.json'),
        group: load('operational/group.json'),
        membership: load('operational/membership.json'),
        operation: load('operational/operation.json'),
        person: load('operational/person.json'),
        process: load('operational/process.json'),
        relationship: load('operational/relationship.json'),
        resource: load('operational/resource.json'),
        role: load('operational/role.json'),
        rule: load('operational/rule.json'),
        task: load('operational/task.json'),
        trigger: load('operational/trigger.json'),
    },
    product: {
        core: {
            action: load('product/core/action.json'),
            field: load('product/core/field.json'),
            operation: load('product/core/operation.json'),
            resource: load('product/core/resource.json'),
        },
        api: {
            endpoint: load('product/api/endpoint.json'),
            namespace: load('product/api/namespace.json'),
            param: load('product/api/param.json'),
            schema: load('product/api/schema.json'),
        },
        web: {
            block: load('product/web/block.json'),
            layout: load('product/web/layout.json'),
            page: load('product/web/page.json'),
            route: load('product/web/route.json'),
        },
    },
    technical: {
        cell: load('technical/cell.json'),
        connection: load('technical/connection.json'),
        construct: load('technical/construct.json'),
        environment: load('technical/environment.json'),
        node: load('technical/node.json'),
        output: load('technical/output.json'),
        provider: load('technical/provider.json'),
        variable: load('technical/variable.json'),
        view: load('technical/view.json'),
        zone: load('technical/zone.json'),
    },
};
exports.documents = {
    operational: load('operational/operational.json'),
    productCore: load('product/product.core.json'),
    productApi: load('product/product.api.json'),
    productUi: load('product/product.ui.json'),
    technical: load('technical/technical.json'),
};
exports.layerDirs = {
    operational: path.join(exports.SCHEMA_ROOT, 'operational'),
    product: path.join(exports.SCHEMA_ROOT, 'product'),
    technical: path.join(exports.SCHEMA_ROOT, 'technical'),
};
function resolveSchemaFile(family, name) {
    const dir = exports.layerDirs[family];
    if (!dir)
        return null;
    const candidate = path.join(dir, `${name}.json`);
    return fs.existsSync(candidate) ? candidate : null;
}
function allSchemas() {
    const out = [];
    const walk = (node) => {
        if (!node || typeof node !== 'object')
            return;
        const obj = node;
        if (typeof obj.$id === 'string') {
            out.push(obj);
            return;
        }
        for (const v of Object.values(obj))
            walk(v);
    };
    walk(exports.schemas);
    walk(exports.documents);
    return out;
}
var validator_1 = require("./validator");
Object.defineProperty(exports, "DnaValidator", { enumerable: true, get: function () { return validator_1.DnaValidator; } });
var builders_1 = require("./builders");
Object.defineProperty(exports, "createOperationalDna", { enumerable: true, get: function () { return builders_1.createOperationalDna; } });
Object.defineProperty(exports, "addResource", { enumerable: true, get: function () { return builders_1.addResource; } });
Object.defineProperty(exports, "addPerson", { enumerable: true, get: function () { return builders_1.addPerson; } });
Object.defineProperty(exports, "addRole", { enumerable: true, get: function () { return builders_1.addRole; } });
Object.defineProperty(exports, "addGroup", { enumerable: true, get: function () { return builders_1.addGroup; } });
Object.defineProperty(exports, "addMembership", { enumerable: true, get: function () { return builders_1.addMembership; } });
Object.defineProperty(exports, "addOperation", { enumerable: true, get: function () { return builders_1.addOperation; } });
Object.defineProperty(exports, "addTrigger", { enumerable: true, get: function () { return builders_1.addTrigger; } });
Object.defineProperty(exports, "addRule", { enumerable: true, get: function () { return builders_1.addRule; } });
Object.defineProperty(exports, "addTask", { enumerable: true, get: function () { return builders_1.addTask; } });
Object.defineProperty(exports, "addProcess", { enumerable: true, get: function () { return builders_1.addProcess; } });
Object.defineProperty(exports, "addRelationship", { enumerable: true, get: function () { return builders_1.addRelationship; } });
var merge_1 = require("./merge");
Object.defineProperty(exports, "merge", { enumerable: true, get: function () { return merge_1.merge; } });
var adapters_1 = require("./types/adapters");
Object.defineProperty(exports, "DEFAULT_STYLES", { enumerable: true, get: function () { return adapters_1.DEFAULT_STYLES; } });
var version_1 = require("./version");
Object.defineProperty(exports, "OPERATIONAL_PRIMITIVE_VERSIONS", { enumerable: true, get: function () { return version_1.OPERATIONAL_PRIMITIVE_VERSIONS; } });
var bookshop_1 = require("./fixtures/bookshop");
Object.defineProperty(exports, "bookshopInput", { enumerable: true, get: function () { return bookshop_1.bookshopInput; } });
var queries_1 = require("./queries");
Object.defineProperty(exports, "getResource", { enumerable: true, get: function () { return queries_1.getResource; } });
Object.defineProperty(exports, "getResources", { enumerable: true, get: function () { return queries_1.getResources; } });
Object.defineProperty(exports, "getPerson", { enumerable: true, get: function () { return queries_1.getPerson; } });
Object.defineProperty(exports, "getPersons", { enumerable: true, get: function () { return queries_1.getPersons; } });
Object.defineProperty(exports, "getRole", { enumerable: true, get: function () { return queries_1.getRole; } });
Object.defineProperty(exports, "getRoles", { enumerable: true, get: function () { return queries_1.getRoles; } });
Object.defineProperty(exports, "getGroup", { enumerable: true, get: function () { return queries_1.getGroup; } });
Object.defineProperty(exports, "getGroups", { enumerable: true, get: function () { return queries_1.getGroups; } });
Object.defineProperty(exports, "getMembership", { enumerable: true, get: function () { return queries_1.getMembership; } });
Object.defineProperty(exports, "getMemberships", { enumerable: true, get: function () { return queries_1.getMemberships; } });
Object.defineProperty(exports, "getOperation", { enumerable: true, get: function () { return queries_1.getOperation; } });
Object.defineProperty(exports, "getOperations", { enumerable: true, get: function () { return queries_1.getOperations; } });
Object.defineProperty(exports, "getOperationsForResource", { enumerable: true, get: function () { return queries_1.getOperationsForResource; } });
Object.defineProperty(exports, "getProcess", { enumerable: true, get: function () { return queries_1.getProcess; } });
Object.defineProperty(exports, "getProcesses", { enumerable: true, get: function () { return queries_1.getProcesses; } });
Object.defineProperty(exports, "getTriggersForProcess", { enumerable: true, get: function () { return queries_1.getTriggersForProcess; } });
Object.defineProperty(exports, "getTask", { enumerable: true, get: function () { return queries_1.getTask; } });
Object.defineProperty(exports, "getTasks", { enumerable: true, get: function () { return queries_1.getTasks; } });
Object.defineProperty(exports, "getTasksForOperation", { enumerable: true, get: function () { return queries_1.getTasksForOperation; } });
Object.defineProperty(exports, "getTriggers", { enumerable: true, get: function () { return queries_1.getTriggers; } });
Object.defineProperty(exports, "getTriggersForOperation", { enumerable: true, get: function () { return queries_1.getTriggersForOperation; } });
Object.defineProperty(exports, "getRule", { enumerable: true, get: function () { return queries_1.getRule; } });
Object.defineProperty(exports, "getRules", { enumerable: true, get: function () { return queries_1.getRules; } });
Object.defineProperty(exports, "getRulesForOperation", { enumerable: true, get: function () { return queries_1.getRulesForOperation; } });
Object.defineProperty(exports, "getActorsForOperation", { enumerable: true, get: function () { return queries_1.getActorsForOperation; } });
Object.defineProperty(exports, "getMembershipsForRole", { enumerable: true, get: function () { return queries_1.getMembershipsForRole; } });
Object.defineProperty(exports, "getMembershipsForPerson", { enumerable: true, get: function () { return queries_1.getMembershipsForPerson; } });
//# sourceMappingURL=index.js.map