import { CoreResource } from '../../../../types';
export declare function generateMigration(nouns: CoreResource[], timestamp: string): string;
/** Generate a migration filename: YYYYMMDDHHMMSS_create_dna_tables.rb */
export declare function migrationFileName(timestamp: string): string;
//# sourceMappingURL=migration.d.ts.map