"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOperational = runOperational;
const args_1 = require("./args");
const design_1 = require("./design");
const discover_1 = require("./discover");
const help_1 = require("./help");
function runOperational(argv, args) {
    if ((0, args_1.boolFlag)(args, 'help') || argv.length === 0) {
        console.log(help_1.OPERATIONAL_HELP);
        return;
    }
    const [command] = argv;
    if (command === 'discover') {
        (0, discover_1.runDiscover)(argv.slice(1), args);
        return;
    }
    (0, design_1.runLayerCommand)('operational', argv, args);
}
//# sourceMappingURL=operational.js.map