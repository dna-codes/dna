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
type ArgMap = {
    positional: string[];
    flags: Record<string, string | boolean>;
};
export declare function runCli(argv: string[], env?: NodeJS.ProcessEnv): Promise<number>;
export declare function parseArgs(argv: string[]): ArgMap;
export {};
//# sourceMappingURL=cli.d.ts.map