/**
 * Python/FastAPI naming conventions derived from DNA names.
 *
 * DNA names are PascalCase (e.g. "Borrower", "LoanApplication").
 * Python expects snake_case for most identifiers.
 */
/** PascalCase → snake_case: 'LoanApplication' → 'loan_application' */
export declare function toSnakeCase(str: string): string;
/** Plural snake_case: 'Borrower' → 'borrowers' */
export declare function toPlural(str: string): string;
/** Table name (plural snake_case): 'Borrower' → 'borrowers' */
export declare function toTableName(str: string): string;
/** Router file name: 'Borrower' → 'borrowers.py' */
export declare function toRouterFileName(str: string): string;
/** Model file name: 'Borrower' → 'borrower.py' */
export declare function toModelFileName(str: string): string;
/** Schema file name: 'Borrower' → 'borrower.py' */
export declare function toSchemaFileName(str: string): string;
/** Method name from action: 'Register' → 'register', 'View' → 'get', 'List' → 'list_all' */
export declare function toActionMethod(action: string): string;
/** DNA type → SQLAlchemy column type import */
export declare function toSqlalchemyType(dnaType: string): string;
/** DNA type → Python/Pydantic type hint */
export declare function toPythonType(dnaType: string): string;
//# sourceMappingURL=naming.d.ts.map