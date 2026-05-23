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
type ArgMap = {
    positional: string[];
    flags: Record<string, string | boolean>;
};
export declare function runCli(argv: string[], env?: NodeJS.ProcessEnv): Promise<number>;
export declare function parseArgs(argv: string[]): ArgMap;
export {};
//# sourceMappingURL=cli.d.ts.map