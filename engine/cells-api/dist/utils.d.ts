import { CoreResource, ProductCoreDNA } from './types';
export declare function toKebabCase(str: string): string;
export declare function toTableName(nounName: string): string;
export declare function toCamelCase(str: string): string;
/** 'Borrower' → 'borrowers', 'LoanApplication' → 'loan-applications' */
export declare function toFileName(resourceName: string): string;
export declare function stripLeadingSlash(p: string): string;
/**
 * Return all CoreResources for a Product Core document. Product Core stores
 * resources as a flat top-level array (the materializer already walked the
 * operational domain tree and emitted the surfaced closure), so this is just
 * a pass-through.
 *
 * Accepts a partial shape so old call-sites that passed `core.domain` or older
 * shapes work too — but prefer passing `core` directly.
 */
export declare function collectNouns(core: ProductCoreDNA | {
    resources?: CoreResource[];
}): CoreResource[];
/** 'Loan.Approve' → resource='Loan', action='Approve' */
export declare function splitOperation(operation: string): {
    resource: string;
    action: string;
};
//# sourceMappingURL=utils.d.ts.map