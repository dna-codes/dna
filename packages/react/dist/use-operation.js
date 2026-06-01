"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOperation = useOperation;
const provider_1 = require("./provider");
function useOperation(name) {
    const ctx = (0, provider_1.useDnaContext)();
    return {
        permitted: ctx.permitted(name),
        perform: (payload) => ctx.perform(name, payload),
    };
}
//# sourceMappingURL=use-operation.js.map