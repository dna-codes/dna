#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const args_1 = require("./args");
const help_1 = require("./help");
const operational_1 = require("./operational");
const product_1 = require("./product");
const technical_1 = require("./technical");
const develop_1 = require("./develop");
const index_1 = require("./deliver/index");
const up_1 = require("./up");
const down_1 = require("./down");
const status_1 = require("./status");
const run_1 = require("./run");
const validate_1 = require("./validate");
const agent_1 = require("./agent");
const views_1 = require("./views");
const context_1 = require("./context");
const output_1 = require("./output");
function main() {
    const argv = process.argv.slice(2);
    const args = (0, args_1.parseArgs)(argv);
    // Find the command (first positional arg)
    const [command, ...rest] = args.positional;
    // No command → root help
    if (!command || command === 'help' && !rest[0]) {
        console.log(help_1.ROOT_HELP);
        return;
    }
    // `cba help <command>`
    if (command === 'help') {
        console.log((0, help_1.helpFor)(rest[0]));
        return;
    }
    // `cba --help` anywhere at the top level
    if ((0, args_1.boolFlag)(args, 'help') && !rest.length) {
        console.log((0, help_1.helpFor)(command));
        return;
    }
    switch (command) {
        case 'operational':
            (0, operational_1.runOperational)(rest, args);
            return;
        case 'product':
            (0, product_1.runProduct)(rest, args);
            return;
        case 'technical':
            (0, technical_1.runTechnical)(rest, args);
            return;
        case 'develop':
            (0, develop_1.runDevelop)(rest, args);
            return;
        case 'deploy':
            (0, index_1.runDeliver)(rest, args);
            return;
        case 'up':
            (0, up_1.runUp)(rest, args);
            return;
        case 'down':
            (0, down_1.runDown)(rest, args);
            return;
        case 'status':
            (0, status_1.runStatus)(rest, args);
            return;
        case 'run':
            (0, run_1.runRun)(rest, args);
            return;
        case 'validate':
            (0, validate_1.runValidate)(rest, args);
            return;
        case 'agent':
            (0, agent_1.runAgent)(rest, args);
            return;
        case 'views':
            (0, views_1.runViews)(rest, args);
            return;
        case 'domains': {
            const opts = { json: (0, args_1.boolFlag)(args, 'json') };
            const domains = (0, context_1.listDomains)((0, context_1.findRepoRoot)());
            (0, output_1.emit)({ domains }, opts, () => domains.length ? domains.map((d) => `  · ${d}`).join('\n') : '(no domains found)');
            return;
        }
        default:
            console.error(`Unknown command: "${command}"\n`);
            console.error(help_1.ROOT_HELP);
            process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map