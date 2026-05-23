"use strict";
/**
 * CLI entrypoint for `integration/neo4j`.
 *
 * Commands (every command needs `--dna <file>`):
 *   migrate
 *   instance:create  --type <name> --in <data.json>
 *   instance:get     --type <name> --id <id>
 *   instance:update  --type <name> --id <id> --in <patch.json>
 *   instance:delete  --type <name> --id <id>
 *   instance:list    --type <name>
 *   link:create      --from-type <T> --from-id <id> --to-type <T> --to-id <id> [--role <r>] [--attributes <file.json>]
 *   link:delete      --id <linkId>
 *   link:list        [--from-type <T> --from-id <id>] [--to-type <T> --to-id <id>] [--role <r>]
 *
 * Credentials come from the environment — never flags — so they don't
 * land in shell history:
 *   NEO4J_URI       e.g. bolt://localhost:7687
 *   NEO4J_USERNAME  basic-auth username
 *   NEO4J_PASSWORD  basic-auth password
 *   NEO4J_DATABASE  (optional) database name
 *
 * Write commands (`instance:create`, `instance:update`, `link:create`)
 * validate the input DNA via `DnaValidator` before any Neo4j write.
 * Validation is the CLI's job, not the library's — see `AGENTS.md`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = runCli;
exports.parseArgs = parseArgs;
const fs_1 = require("fs");
const dna_core_1 = require("@dna-codes/dna-core");
const client_1 = require("./client");
async function runCli(argv, env = process.env) {
    const [command, ...rest] = argv;
    if (!command || command === 'help' || command === '--help') {
        printUsage();
        return 0;
    }
    const args = parseArgs(rest);
    try {
        switch (command) {
            case 'migrate':
                return await migrateCommand(args, env);
            case 'instance:create':
                return await instanceCreateCommand(args, env);
            case 'instance:get':
                return await instanceGetCommand(args, env);
            case 'instance:update':
                return await instanceUpdateCommand(args, env);
            case 'instance:delete':
                return await instanceDeleteCommand(args, env);
            case 'instance:list':
                return await instanceListCommand(args, env);
            case 'link:create':
                return await linkCreateCommand(args, env);
            case 'link:delete':
                return await linkDeleteCommand(args, env);
            case 'link:list':
                return await linkListCommand(args, env);
            default:
                console.error(`Unknown command: ${command}\n`);
                printUsage();
                return 64;
        }
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
    }
}
function clientOptionsFromEnv(env) {
    const uri = env.NEO4J_URI;
    const username = env.NEO4J_USERNAME;
    const password = env.NEO4J_PASSWORD;
    if (!uri || !username || !password) {
        throw new Error('Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your environment.');
    }
    return {
        uri,
        username,
        password,
        ...(env.NEO4J_DATABASE ? { database: env.NEO4J_DATABASE } : {}),
    };
}
function loadDna(args) {
    const path = requireFlag(args, 'dna');
    if (!path)
        throw new Error('--dna <path> is required');
    const raw = (0, fs_1.readFileSync)(path, 'utf-8');
    return JSON.parse(raw);
}
function validateDna(dna) {
    const validator = new dna_core_1.DnaValidator();
    const result = validator.validate(dna, 'https://dna.codes/schemas/operational');
    if (!result.valid) {
        const messages = result.errors.map((e) => `  - ${e.instancePath || '/'}: ${e.message}`).join('\n');
        throw new Error(`DNA validation failed:\n${messages}`);
    }
}
function readJsonFile(path) {
    return JSON.parse((0, fs_1.readFileSync)(path, 'utf-8'));
}
async function migrateCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const dna = loadDna(args);
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        await client.migrate();
        console.log('migrated');
        return 0;
    }
    finally {
        await client.close();
    }
}
async function instanceCreateCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const type = requireFlag(args, 'type');
    const input = requireFlag(args, 'in');
    if (!type || !input)
        return 64;
    const dna = loadDna(args);
    validateDna(dna);
    const data = readJsonFile(input);
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        const { id } = await client.instance.create(type, data);
        console.log(JSON.stringify({ id }));
        return 0;
    }
    finally {
        await client.close();
    }
}
async function instanceGetCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const type = requireFlag(args, 'type');
    const id = requireFlag(args, 'id');
    if (!type || !id)
        return 64;
    const dna = loadDna(args);
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        const record = await client.instance.get(type, id);
        if (record === null) {
            console.error(`not found: ${type} ${id}`);
            return 1;
        }
        console.log(JSON.stringify(record, null, 2));
        return 0;
    }
    finally {
        await client.close();
    }
}
async function instanceUpdateCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const type = requireFlag(args, 'type');
    const id = requireFlag(args, 'id');
    const input = requireFlag(args, 'in');
    if (!type || !id || !input)
        return 64;
    const dna = loadDna(args);
    validateDna(dna);
    const patch = readJsonFile(input);
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        await client.instance.update(type, id, patch);
        console.log('updated');
        return 0;
    }
    finally {
        await client.close();
    }
}
async function instanceDeleteCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const type = requireFlag(args, 'type');
    const id = requireFlag(args, 'id');
    if (!type || !id)
        return 64;
    const dna = loadDna(args);
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        await client.instance.delete(type, id);
        console.log('deleted');
        return 0;
    }
    finally {
        await client.close();
    }
}
async function instanceListCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const type = requireFlag(args, 'type');
    if (!type)
        return 64;
    const dna = loadDna(args);
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        const records = await client.instance.list(type);
        console.log(JSON.stringify(records, null, 2));
        return 0;
    }
    finally {
        await client.close();
    }
}
async function linkCreateCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const fromType = requireFlag(args, 'from-type');
    const fromId = requireFlag(args, 'from-id');
    const toType = requireFlag(args, 'to-type');
    const toId = requireFlag(args, 'to-id');
    if (!fromType || !fromId || !toType || !toId)
        return 64;
    const dna = loadDna(args);
    validateDna(dna);
    const role = typeof args.flags.role === 'string' ? args.flags.role : undefined;
    const attributesFile = typeof args.flags.attributes === 'string' ? args.flags.attributes : undefined;
    const attributes = attributesFile ? readJsonFile(attributesFile) : undefined;
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        const { id } = await client.link.create({ typeName: fromType, id: fromId }, { typeName: toType, id: toId }, { ...(role !== undefined ? { role } : {}), ...(attributes !== undefined ? { attributes } : {}) });
        console.log(JSON.stringify({ id }));
        return 0;
    }
    finally {
        await client.close();
    }
}
async function linkDeleteCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const id = requireFlag(args, 'id');
    if (!id)
        return 64;
    const dna = loadDna(args);
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        await client.link.delete(id);
        console.log('deleted');
        return 0;
    }
    finally {
        await client.close();
    }
}
async function linkListCommand(args, env) {
    const credentials = clientOptionsFromEnv(env);
    const dna = loadDna(args);
    const fromType = typeof args.flags['from-type'] === 'string' ? args.flags['from-type'] : undefined;
    const fromId = typeof args.flags['from-id'] === 'string' ? args.flags['from-id'] : undefined;
    const toType = typeof args.flags['to-type'] === 'string' ? args.flags['to-type'] : undefined;
    const toId = typeof args.flags['to-id'] === 'string' ? args.flags['to-id'] : undefined;
    const role = typeof args.flags.role === 'string' ? args.flags.role : undefined;
    const filter = {};
    if (fromType && fromId)
        filter.from = { typeName: fromType, id: fromId };
    if (toType && toId)
        filter.to = { typeName: toType, id: toId };
    if (role !== undefined)
        filter.role = role;
    const client = (0, client_1.createClient)(credentials, dna);
    try {
        const records = await client.link.list(filter);
        console.log(JSON.stringify(records, null, 2));
        return 0;
    }
    finally {
        await client.close();
    }
}
function requireFlag(args, name) {
    const value = args.flags[name];
    if (typeof value !== 'string') {
        console.error(`--${name} <value> is required`);
        return null;
    }
    return value;
}
function parseArgs(argv) {
    const flags = {};
    const positional = [];
    for (let i = 0; i < argv.length; i++) {
        const tok = argv[i];
        if (tok.startsWith('--')) {
            const key = tok.slice(2);
            const next = argv[i + 1];
            if (next && !next.startsWith('--')) {
                flags[key] = next;
                i++;
            }
            else {
                flags[key] = true;
            }
        }
        else {
            positional.push(tok);
        }
    }
    return { positional, flags };
}
function printUsage() {
    console.log(`integration-neo4j — runtime-data store backed by Neo4j

Usage:
  integration-neo4j migrate              --dna <path>
  integration-neo4j instance:create      --type <name>  --in <data.json>   --dna <path>
  integration-neo4j instance:get         --type <name>  --id <id>          --dna <path>
  integration-neo4j instance:update      --type <name>  --id <id>  --in <patch.json>  --dna <path>
  integration-neo4j instance:delete      --type <name>  --id <id>          --dna <path>
  integration-neo4j instance:list        --type <name>                     --dna <path>
  integration-neo4j link:create          --from-type <T> --from-id <id> --to-type <T> --to-id <id>
                                         [--role <r>] [--attributes <file.json>]    --dna <path>
  integration-neo4j link:delete          --id <linkId>                              --dna <path>
  integration-neo4j link:list            [--from-type <T> --from-id <id>] [--to-type <T> --to-id <id>]
                                         [--role <r>]                               --dna <path>

Environment:
  NEO4J_URI         e.g. bolt://localhost:7687  (required)
  NEO4J_USERNAME    basic-auth username          (required)
  NEO4J_PASSWORD    basic-auth password          (required)
  NEO4J_DATABASE    database name                (optional)

Write commands validate the supplied DNA via @dna-codes/dna-core's
DnaValidator before any Neo4j write. The library API itself does not
validate — that is the caller's responsibility.
`);
}
//# sourceMappingURL=cli.js.map