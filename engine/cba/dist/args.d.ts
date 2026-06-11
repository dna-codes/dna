export interface ParsedArgs {
    positional: string[];
    flags: Record<string, string | boolean>;
}
/**
 * Minimal argv parser. Supports:
 *   --flag              → true
 *   --flag value        → "value"
 *   --flag=value        → "value"
 *   positional args     → in order
 */
export declare function parseArgs(argv: string[]): ParsedArgs;
export declare function flag(args: ParsedArgs, name: string): string | undefined;
export declare function boolFlag(args: ParsedArgs, name: string): boolean;
