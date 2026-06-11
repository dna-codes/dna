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
exports.runLayerCommand = runLayerCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dna_core_1 = require("@dna-codes/dna-core");
const context_1 = require("./context");
const primitives_1 = require("./primitives");
const args_1 = require("./args");
const output_1 = require("./output");
const VALID_COMMANDS = ['list', 'show', 'add', 'remove', 'schema', 'validate'];
/**
 * Run a design command for a pre-determined layer.
 * argv = [command, domain, ...]
 */
function runLayerCommand(layer, argv, args) {
    const json = (0, args_1.boolFlag)(args, 'json');
    const opts = { json };
    const [command, domain] = argv;
    if (!command) {
        (0, output_1.emitError)(`Missing <command>. Valid: ${VALID_COMMANDS.join(', ')}`, opts);
        process.exit(1);
    }
    // `schema` does not need a domain
    if (command === 'schema') {
        cmdSchema(layer, argv[1], opts);
        return;
    }
    if (!domain) {
        (0, output_1.emitError)(`Missing <domain>. Usage: cba ${layerCliName(layer)} ${command} <domain>`, opts);
        process.exit(1);
    }
    switch (command) {
        case 'list':
            cmdList(layer, domain, args, opts);
            return;
        case 'show':
            cmdShow(layer, domain, args, opts);
            return;
        case 'add':
            cmdAdd(layer, domain, args, opts);
            return;
        case 'remove':
            cmdRemove(layer, domain, args, opts);
            return;
        case 'validate':
            cmdValidateLayer(layer, domain, opts);
            return;
        default:
            (0, output_1.emitError)(`Unknown command: "${command}". Valid: ${VALID_COMMANDS.join(', ')}`, opts);
            process.exit(1);
    }
}
function layerCliName(layer) {
    switch (layer) {
        case 'operational': return 'operational';
        case 'product.core': return 'product core';
        case 'product.api': return 'product api';
        case 'product.ui': return 'product ui';
        case 'technical': return 'technical';
    }
}
function cmdList(layer, domain, args, opts) {
    const typeFilter = (0, args_1.flag)(args, 'type');
    const paths = (0, context_1.resolveDomain)(domain);
    const doc = (0, context_1.loadLayer)(paths, layer);
    const specs = typeFilter
        ? (0, primitives_1.primitivesForLayer)(layer).filter((s) => s.type.toLowerCase() === typeFilter.toLowerCase())
        : (0, primitives_1.primitivesForLayer)(layer);
    if (typeFilter && specs.length === 0) {
        (0, output_1.emitError)(`Unknown primitive type "${typeFilter}" for layer "${layer}"`, opts, {
            validTypes: (0, primitives_1.primitivesForLayer)(layer).map((s) => s.type),
        });
        process.exit(1);
    }
    const results = specs.flatMap((spec) => (0, primitives_1.collectPrimitives)(doc, spec).map((p) => ({
        type: p.type,
        name: p.name,
        domainPath: p.domainPath,
    })));
    (0, output_1.emit)({ layer, domain, count: results.length, primitives: results }, opts, () => {
        var _a;
        if (results.length === 0)
            return `(no primitives found)`;
        const lines = [`${layer} · ${domain} — ${results.length} primitive(s)`];
        const byType = {};
        for (const r of results)
            (byType[_a = r.type] ?? (byType[_a] = [])).push(r);
        for (const [type, items] of Object.entries(byType)) {
            lines.push(``, `  ${type} (${items.length})`);
            for (const i of items) {
                const loc = i.domainPath ? `  [${i.domainPath}]` : '';
                lines.push(`    · ${i.name}${loc}`);
            }
        }
        return lines.join('\n');
    });
}
function cmdShow(layer, domain, args, opts) {
    const type = (0, args_1.flag)(args, 'type');
    const name = (0, args_1.flag)(args, 'name');
    if (!type) {
        (0, output_1.emitError)('--type is required', opts);
        process.exit(1);
    }
    const spec = (0, primitives_1.findPrimitiveSpec)(layer, type);
    if (!spec) {
        (0, output_1.emitError)(`Unknown primitive type "${type}" for layer "${layer}"`, opts);
        process.exit(1);
    }
    const paths = (0, context_1.resolveDomain)(domain);
    const doc = (0, context_1.loadLayer)(paths, layer);
    const all = (0, primitives_1.collectPrimitives)(doc, spec);
    // Singletons (Namespace, Layout) — return without --name
    if (spec.singleton) {
        if (all.length === 0) {
            (0, output_1.emitError)(`${type} not found in ${layer}`, opts);
            process.exit(1);
        }
        (0, output_1.emit)(all[0].node, opts, () => JSON.stringify(all[0].node, null, 2));
        return;
    }
    if (!name) {
        (0, output_1.emitError)('--name is required for this primitive', opts);
        process.exit(1);
    }
    const match = all.find((p) => p.name === name);
    if (!match) {
        (0, output_1.emitError)(`${type} "${name}" not found in ${layer} of ${domain}`, opts, {
            available: all.map((p) => p.name),
        });
        process.exit(1);
    }
    (0, output_1.emit)(match.node, opts, () => JSON.stringify(match.node, null, 2));
}
function cmdSchema(layer, type, opts) {
    if (!type) {
        // List all primitives in the layer
        const specs = (0, primitives_1.primitivesForLayer)(layer);
        (0, output_1.emit)({ layer, primitives: specs.map((s) => s.type) }, opts, () => [`${layer} primitives:`, ...specs.map((s) => `  · ${s.type}`)].join('\n'));
        return;
    }
    const spec = (0, primitives_1.findPrimitiveSpec)(layer, type);
    if (!spec) {
        (0, output_1.emitError)(`Unknown primitive type "${type}" for layer "${layer}"`, opts, {
            validTypes: (0, primitives_1.primitivesForLayer)(layer).map((s) => s.type),
        });
        process.exit(1);
    }
    // Load the JSON schema from the corresponding schemas directory
    const schemaFile = findSchemaFile(spec.type, spec.layer);
    if (!schemaFile) {
        (0, output_1.emitError)(`Schema file not found for ${spec.type}`, opts);
        process.exit(1);
    }
    const schemaDoc = JSON.parse(fs.readFileSync(schemaFile, 'utf-8'));
    (0, output_1.emit)(schemaDoc, opts, () => JSON.stringify(schemaDoc, null, 2));
}
function findSchemaFile(type, layer) {
    const lowerType = type.toLowerCase();
    const candidates = [];
    if (layer === 'operational') {
        candidates.push((0, dna_core_1.resolveSchemaFile)('operational', lowerType));
    }
    else if (layer === 'product.core') {
        candidates.push((0, dna_core_1.resolveSchemaFile)('product', `core/${lowerType}`));
    }
    else if (layer === 'product.api') {
        candidates.push((0, dna_core_1.resolveSchemaFile)('product', `api/${lowerType}`), 
        // Fallback for shapes shared with product/core (e.g. Resource)
        (0, dna_core_1.resolveSchemaFile)('product', `core/${lowerType}`));
    }
    else if (layer === 'product.ui') {
        candidates.push((0, dna_core_1.resolveSchemaFile)('product', `web/${lowerType}`));
    }
    else if (layer === 'technical') {
        candidates.push((0, dna_core_1.resolveSchemaFile)('technical', lowerType));
    }
    return candidates.find((c) => !!c);
}
function cmdAdd(layer, domain, args, opts) {
    var _a, _b;
    const type = (0, args_1.flag)(args, 'type');
    const file = (0, args_1.flag)(args, 'file');
    const at = (0, args_1.flag)(args, 'at');
    if (!type || !file) {
        (0, output_1.emitError)('--type and --file are required', opts);
        process.exit(1);
    }
    const spec = (0, primitives_1.findPrimitiveSpec)(layer, type);
    if (!spec) {
        (0, output_1.emitError)(`Unknown primitive type "${type}" for layer "${layer}"`, opts);
        process.exit(1);
    }
    const primitiveJson = JSON.parse(fs.readFileSync(path.resolve(file), 'utf-8'));
    if (!primitiveJson.name && !spec.singleton) {
        (0, output_1.emitError)(`Primitive JSON must include a "name" field`, opts);
        process.exit(1);
    }
    const paths = (0, context_1.resolveDomain)(domain);
    const doc = (0, context_1.loadLayer)(paths, layer);
    if (spec.nested && spec.childOf === 'noun') {
        // Action / Attribute on a Resource/Person/Role/Group — needs --at <domain-path>:<noun-name>
        const [dpath, nounName] = (at ?? '').split(':');
        if (!dpath || !nounName) {
            (0, output_1.emitError)(`--at must be <domain-path>:<noun-name> for ${spec.type} (e.g. acme.finance.lending:Loan)`, opts);
            process.exit(1);
        }
        const found = (0, primitives_1.findNounByName)(doc.domain, dpath, nounName);
        if (!found) {
            (0, output_1.emitError)(`Noun "${nounName}" not found at ${dpath}`, opts);
            process.exit(1);
        }
        const key = spec.location.endsWith('.actions') ? 'actions' : 'attributes';
        (_a = found.noun)[key] ?? (_a[key] = []);
        if (found.noun[key].some((i) => i.name === primitiveJson.name)) {
            (0, output_1.emitError)(`${spec.type} "${primitiveJson.name}" already exists at ${at}`, opts);
            process.exit(1);
        }
        found.noun[key].push(primitiveJson);
    }
    else if (spec.nested && spec.location.startsWith('domain.*')) {
        // Resource / Person / Role / Group — --at <domain-path>
        if (!at) {
            (0, output_1.emitError)(`--at <domain-path> is required for ${spec.type}`, opts);
            process.exit(1);
        }
        const target = (0, primitives_1.findDomainByPath)(doc.domain, at);
        if (!target) {
            (0, output_1.emitError)(`Domain path not found: "${at}"`, opts);
            process.exit(1);
        }
        const field = spec.location.split('.').pop(); // resources | persons | roles | groups
        target[field] ?? (target[field] = []);
        if (target[field].some((i) => i.name === primitiveJson.name)) {
            (0, output_1.emitError)(`${spec.type} "${primitiveJson.name}" already exists at ${at}`, opts);
            process.exit(1);
        }
        target[field].push(primitiveJson);
    }
    else if (spec.singleton) {
        doc[spec.location] = primitiveJson;
    }
    else {
        doc[_b = spec.location] ?? (doc[_b] = []);
        if (doc[spec.location].some((i) => i.name === primitiveJson.name)) {
            (0, output_1.emitError)(`${spec.type} "${primitiveJson.name}" already exists in ${layer}`, opts);
            process.exit(1);
        }
        doc[spec.location].push(primitiveJson);
    }
    (0, context_1.saveLayer)(paths, layer, doc);
    (0, output_1.emitOk)({ layer, type: spec.type, name: primitiveJson.name ?? spec.type, file: paths.files[layer] }, opts, () => `✓ Added ${spec.type} "${primitiveJson.name ?? spec.type}" to ${layer} (${domain})`);
}
function cmdRemove(layer, domain, args, opts) {
    const type = (0, args_1.flag)(args, 'type');
    const name = (0, args_1.flag)(args, 'name');
    if (!type || !name) {
        (0, output_1.emitError)('--type and --name are required', opts);
        process.exit(1);
    }
    const spec = (0, primitives_1.findPrimitiveSpec)(layer, type);
    if (!spec) {
        (0, output_1.emitError)(`Unknown primitive type "${type}" for layer "${layer}"`, opts);
        process.exit(1);
    }
    const paths = (0, context_1.resolveDomain)(domain);
    const doc = (0, context_1.loadLayer)(paths, layer);
    let removed = false;
    if (spec.nested && spec.childOf === 'noun') {
        // Action / Attribute removal — sweep all noun primitives
        const childKey = spec.location.endsWith('.actions') ? 'actions' : 'attributes';
        (0, primitives_1.walkDomains)(doc.domain, (node) => {
            for (const nounField of ['resources', 'persons', 'roles', 'groups']) {
                for (const noun of node[nounField] ?? []) {
                    const idx = (noun[childKey] ?? []).findIndex((i) => i.name === name);
                    if (idx >= 0) {
                        noun[childKey].splice(idx, 1);
                        removed = true;
                    }
                }
            }
        });
    }
    else if (spec.nested && spec.location.startsWith('domain.*')) {
        const field = spec.location.split('.').pop(); // resources | persons | roles | groups
        (0, primitives_1.walkDomains)(doc.domain, (node) => {
            const idx = (node[field] ?? []).findIndex((i) => i.name === name);
            if (idx >= 0) {
                node[field].splice(idx, 1);
                removed = true;
            }
        });
    }
    else {
        const arr = doc[spec.location];
        if (Array.isArray(arr)) {
            const idx = arr.findIndex((i) => i.name === name);
            if (idx >= 0) {
                arr.splice(idx, 1);
                removed = true;
            }
        }
    }
    if (!removed) {
        (0, output_1.emitError)(`${spec.type} "${name}" not found in ${layer} of ${domain}`, opts);
        process.exit(1);
    }
    (0, context_1.saveLayer)(paths, layer, doc);
    (0, output_1.emitOk)({ layer, type: spec.type, name, file: paths.files[layer] }, opts, () => `✓ Removed ${spec.type} "${name}" from ${layer} (${domain})`);
}
function cmdValidateLayer(layer, domain, opts) {
    const paths = (0, context_1.resolveDomain)(domain);
    const doc = (0, context_1.loadLayer)(paths, layer);
    const schemaId = layerSchemaId(layer);
    const validator = new dna_core_1.DnaValidator();
    const result = validator.validate(doc, schemaId);
    if (result.valid) {
        (0, output_1.emitOk)({ layer, domain, valid: true }, opts, () => `✓ Valid ${layer}`);
        return;
    }
    const errs = result.errors.map((e) => ({
        path: e.instancePath || '/',
        message: e.message,
        schemaPath: e.schemaPath,
    }));
    if (opts.json) {
        console.log(JSON.stringify({ ok: false, layer, domain, valid: false, errors: errs }, null, 2));
    }
    else {
        console.error(`✗ Invalid ${layer}`);
        for (const e of errs)
            console.error(`  ${e.path} ${e.message}`);
    }
    process.exit(1);
}
function layerSchemaId(layer) {
    switch (layer) {
        case 'operational':
            return 'operational';
        case 'product.core':
            return 'product/core';
        case 'product.api':
            return 'product/api';
        case 'product.ui':
            return 'product/ui';
        case 'technical':
            return 'technical';
    }
}
//# sourceMappingURL=design.js.map