"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetContent = exports.SheetClose = exports.SheetTrigger = exports.Sheet = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const DialogPrimitive = __importStar(require("@radix-ui/react-dialog"));
const class_variance_authority_1 = require("class-variance-authority");
const utils_1 = require("./utils");
const Sheet = DialogPrimitive.Root;
exports.Sheet = Sheet;
const SheetTrigger = DialogPrimitive.Trigger;
exports.SheetTrigger = SheetTrigger;
const SheetClose = DialogPrimitive.Close;
exports.SheetClose = SheetClose;
const SheetPortal = DialogPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => ((0, jsx_runtime_1.jsx)(DialogPrimitive.Overlay, { ref: ref, className: (0, utils_1.cn)('fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 data-[state=open]:opacity-100 data-[state=closed]:opacity-0', className), ...props })));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;
const sheetVariants = (0, class_variance_authority_1.cva)('fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out', {
    variants: {
        side: {
            top: 'inset-x-0 top-0 border-b data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-full',
            bottom: 'inset-x-0 bottom-0 border-t data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full',
            left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full',
            right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full',
        },
    },
    defaultVariants: {
        side: 'right',
    },
});
const SheetContent = React.forwardRef(({ side = 'right', className, children, ...props }, ref) => ((0, jsx_runtime_1.jsxs)(SheetPortal, { children: [(0, jsx_runtime_1.jsx)(SheetOverlay, {}), (0, jsx_runtime_1.jsxs)(DialogPrimitive.Content, { ref: ref, className: (0, utils_1.cn)(sheetVariants({ side }), className), ...props, children: [children, (0, jsx_runtime_1.jsxs)(SheetClose, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [(0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M18 6 6 18" }), (0, jsx_runtime_1.jsx)("path", { d: "m6 6 12 12" })] }), (0, jsx_runtime_1.jsx)("span", { className: "sr-only", children: "Close" })] })] })] })));
exports.SheetContent = SheetContent;
SheetContent.displayName = DialogPrimitive.Content.displayName;
//# sourceMappingURL=sheet.js.map