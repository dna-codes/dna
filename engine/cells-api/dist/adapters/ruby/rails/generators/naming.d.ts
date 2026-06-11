/**
 * Ruby/Rails naming conventions derived from DNA names.
 *
 * DNA names are PascalCase (e.g. "Borrower", "LoanApplication").
 * Rails expects specific casing for different contexts.
 */
/** PascalCase → snake_case: 'LoanApplication' → 'loan_application' */
export declare function toSnakeCase(str: string): string;
/** Plural snake_case: 'Borrower' → 'borrowers' */
export declare function toPlural(str: string): string;
/** Table name (plural snake_case): 'Borrower' → 'borrowers' */
export declare function toTableName(str: string): string;
/** Controller class name: 'Borrower' → 'BorrowersController' */
export declare function toControllerName(str: string): string;
/** Controller file name: 'Borrower' → 'borrowers_controller.rb' */
export declare function toControllerFileName(str: string): string;
/** Model file name: 'Borrower' → 'borrower.rb' */
export declare function toModelFileName(str: string): string;
/** Method name from action: 'Register' → 'register', 'View' → 'show', 'List' → 'index' */
export declare function toActionMethod(action: string): string;
/** DNA type → Rails migration column type */
export declare function toRailsColumnType(dnaType: string): string;
//# sourceMappingURL=naming.d.ts.map