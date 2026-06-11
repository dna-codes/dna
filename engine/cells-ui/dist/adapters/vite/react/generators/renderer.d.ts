export declare function rendererGlobalsCss(layout: any): string;
export declare function rendererContext(): string;
export declare function rendererTypes(): string;
export declare function rendererDnaLoader(): string;
export declare function rendererApiHook(): string;
export declare function rendererApp(): string;
export declare function rendererLayout(): string;
export declare function rendererMarketingLayout(): string;
export declare function rendererPage(): string;
export declare function rendererBlock(): string;
export declare function rendererFormBlock(): string;
/**
 * SurveyBlock — renders a form via SurveyJS so the marketing site can ship
 * a branded intake with validation, progress, and a thank-you state without
 * hand-authoring inputs.
 *
 * The survey model is built directly from block.fields (the product.ui.json
 * entry) and wired to the endpoint resolved from block.operation. Theme is
 * applied via SurveyJS v1.12+ CSS variables so brand colors flow through from
 * globals.css (which maps them to the layout DNA theme config).
 */
export declare function rendererSurveyBlock(): string;
export declare function rendererTableBlock(): string;
export declare function rendererDetailBlock(): string;
export declare function rendererActionsBlock(): string;
export declare function rendererEmptyStateBlock(): string;
export declare function rendererLayoutMachine(): string;
export declare function rendererUniversalLayout(primitivesPath: string): string;
export declare function rendererFlagsContext(): string;
export declare function rendererRules(): string;
//# sourceMappingURL=renderer.d.ts.map