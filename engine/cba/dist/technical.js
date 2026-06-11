"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTechnical = runTechnical;
const args_1 = require("./args");
const design_1 = require("./design");
const help_1 = require("./help");
function runTechnical(argv, args) {
    if ((0, args_1.boolFlag)(args, 'help') || argv.length === 0) {
        console.log(help_1.TECHNICAL_HELP);
        return;
    }
    (0, design_1.runLayerCommand)('technical', argv, args);
}
//# sourceMappingURL=technical.js.map