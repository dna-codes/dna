"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRule = addRule;
const shared_1 = require("./shared");
/**
 * Add a Rule to the DNA's top-level `rules`. Identity is by `name` when
 * present, otherwise by `(operation, subtype)`.
 */
function addRule(dna, rule, opts) {
    return (0, shared_1.composeInto)(dna, rule, 'rules', 'operational/rule', opts);
}
//# sourceMappingURL=rule.js.map