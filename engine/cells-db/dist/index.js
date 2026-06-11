"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const run_1 = require("./run");
// CLI: db-cell <technical.json> <cell-name> <output-dir>
if (require.main === module) {
    const [, , technicalPath, cellName, outputDir] = process.argv;
    if (!technicalPath || !cellName || !outputDir) {
        console.error('Usage: db-cell <path-to-technical.json> <cell-name> <output-dir>');
        process.exit(1);
    }
    try {
        (0, run_1.run)(technicalPath, cellName, outputDir);
    }
    catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
var run_2 = require("./run");
Object.defineProperty(exports, "run", { enumerable: true, get: function () { return run_2.run; } });
//# sourceMappingURL=index.js.map