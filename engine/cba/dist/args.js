"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = parseArgs;
exports.flag = flag;
exports.boolFlag = boolFlag;
/**
 * Minimal argv parser. Supports:
 *   --flag              → true
 *   --flag value        → "value"
 *   --flag=value        → "value"
 *   positional args     → in order
 */
function parseArgs(argv) {
    const positional = [];
    const flags = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith('--')) {
            const eq = arg.indexOf('=');
            if (eq > -1) {
                flags[arg.slice(2, eq)] = arg.slice(eq + 1);
            }
            else {
                const name = arg.slice(2);
                const next = argv[i + 1];
                if (next && !next.startsWith('--')) {
                    flags[name] = next;
                    i++;
                }
                else {
                    flags[name] = true;
                }
            }
        }
        else {
            positional.push(arg);
        }
    }
    return { positional, flags };
}
function flag(args, name) {
    const v = args.flags[name];
    return typeof v === 'string' ? v : undefined;
}
function boolFlag(args, name) {
    return args.flags[name] === true || args.flags[name] === 'true';
}
//# sourceMappingURL=args.js.map