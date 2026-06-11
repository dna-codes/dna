import { DbCellAdapter } from '../../types';
/**
 * db-cell (postgres) is infrastructure-only. It provisions the database and
 * the application role via postgres's own init scripts. It does NOT own
 * application tables — schema migrations, seeds, and queries are owned by
 * api-cell via drizzle, connecting as app_role.
 */
export declare const generate: DbCellAdapter['generate'];
//# sourceMappingURL=index.d.ts.map