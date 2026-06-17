"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPosition = addPosition;
const shared_1 = require("./shared");
/**
 * Add a Position template to the DNA's `domain.positions`. Same-name composes via
 * merge rules.
 */
function addPosition(dna, position, opts) {
    return (0, shared_1.composeInto)(dna, position, 'positions', 'operational/position', opts);
}
//# sourceMappingURL=position.js.map