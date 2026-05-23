"use strict";
/**
 * CLI entrypoint for `@dna-codes/dna-api`.
 *
 * Commands:
 *   serve --dna <path> [--port <port>]
 *   help
 *
 * Environment fallbacks (see design.md D4 / D7):
 *   DNA_FILE       Path to the OperationalDNA JSON document.
 *   PORT           Listen port. Default 4000.
 *   NEO4J_URI      Bolt URI for the runtime data store. Required.
 *   NEO4J_USERNAME Basic-auth username. Required.
 *   NEO4J_PASSWORD Basic-auth password. Required.
 *   NEO4J_DATABASE Optional database name.
 *
 * Credentials never come from flags — flags land in shell history.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = runCli;
exports.parseArgs = parseArgs;
const fs_1 = require("fs");
const neo4j_1 = require("@dna-codes/dna-adapters/integration/neo4j");
const server_1 = require("./server");
async function runCli(argv, env = process.env) {
    const [command, ...rest] = argv;
    if (!command || command === 'help' || command === '--help') {
        printUsage();
        return 0;
    }
    const args = parseArgs(rest);
    try {
        if (command === 'serve')
            return await serveCommand(args, env);
        console.error(`Unknown command: ${command}\n`);
        printUsage();
        return 64;
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
    }
}
async function serveCommand(args, env) {
    const dnaPath = resolveDnaPath(args, env);
    const port = resolvePort(args, env);
    const neo4jOpts = resolveNeo4jOptions(env);
    const dna = loadDna(dnaPath);
    const dataStore = (0, neo4j_1.createClient)(neo4jOpts, dna);
    const server = await (0, server_1.createServer)({ dna, dataStore });
    const handle = await server.listen(port);
    console.log(`dna-api listening on http://localhost:${port}/graphql (DNA: ${dnaPath})`);
    // Wire graceful-shutdown signals for container friendliness.
    const shutdown = async (signal) => {
        console.log(`received ${signal}, shutting down…`);
        try {
            await handle.close();
            await dataStore.close();
        }
        finally {
            process.exit(0);
        }
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    // serveCommand never returns under normal operation — `process.exit` in
    // the shutdown handler is the exit path. Return a never-resolving
    // promise so the CLI shim doesn't print a misleading "command succeeded".
    return new Promise(() => { });
}
function resolveDnaPath(args, env) {
    const flag = typeof args.flags.dna === 'string' ? args.flags.dna : undefined;
    const envPath = typeof env.DNA_FILE === 'string' && env.DNA_FILE.length > 0 ? env.DNA_FILE : undefined;
    const path = flag ?? envPath;
    if (!path) {
        throw new Error('Set --dna <path> or the DNA_FILE environment variable.');
    }
    return path;
}
function resolvePort(args, env) {
    const flag = typeof args.flags.port === 'string' ? args.flags.port : undefined;
    const envPort = typeof env.PORT === 'string' && env.PORT.length > 0 ? env.PORT : undefined;
    const raw = flag ?? envPort ?? '4000';
    const port = Number(raw);
    if (!Number.isFinite(port) || port <= 0 || port >= 65536) {
        throw new Error(`Invalid port "${raw}"; expected an integer in 1..65535.`);
    }
    return port;
}
function resolveNeo4jOptions(env) {
    const uri = env.NEO4J_URI;
    const username = env.NEO4J_USERNAME;
    const password = env.NEO4J_PASSWORD;
    if (!uri || !username || !password) {
        throw new Error('Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in the environment.');
    }
    return {
        uri,
        username,
        password,
        ...(typeof env.NEO4J_DATABASE === 'string' && env.NEO4J_DATABASE.length > 0
            ? { database: env.NEO4J_DATABASE }
            : {}),
    };
}
function loadDna(path) {
    const raw = (0, fs_1.readFileSync)(path, 'utf-8');
    return JSON.parse(raw);
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
    console.log(`dna-api — DNA-derived GraphQL API server

Usage:
  dna-api serve --dna <path> [--port <port>]
  dna-api help

Flags:
  --dna <path>    Path to an OperationalDNA JSON document.
                  Falls back to DNA_FILE env var.
  --port <port>   HTTP port to bind (default 4000; falls back to PORT env var).

Environment:
  DNA_FILE         OperationalDNA JSON document path (fallback for --dna).
  PORT             HTTP port to bind (fallback for --port).
  NEO4J_URI        Bolt URI (e.g. bolt://localhost:7687). Required.
  NEO4J_USERNAME   Basic-auth username. Required.
  NEO4J_PASSWORD   Basic-auth password. Required.
  NEO4J_DATABASE   Optional database name.

The server exposes:
  GET  /healthz    Liveness probe — returns 200 OK.
  POST /graphql    GraphQL endpoint (Apollo Server).
`);
}
//# sourceMappingURL=cli.js.map