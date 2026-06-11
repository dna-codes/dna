"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emit = emit;
exports.emitError = emitError;
exports.emitOk = emitOk;
function emit(data, opts, humanFormatter) {
    if (opts.json) {
        console.log(JSON.stringify(data, null, 2));
    }
    else {
        console.log(humanFormatter());
    }
}
function emitError(message, opts, extra = {}) {
    if (opts.json) {
        console.error(JSON.stringify({ ok: false, error: message, ...extra }, null, 2));
    }
    else {
        console.error(`Error: ${message}`);
    }
}
function emitOk(data, opts, humanFormatter) {
    if (opts.json) {
        console.log(JSON.stringify({ ok: true, ...data }, null, 2));
    }
    else {
        console.log(humanFormatter());
    }
}
//# sourceMappingURL=output.js.map