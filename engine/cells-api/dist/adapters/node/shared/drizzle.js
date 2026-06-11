"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDrizzleSchema = generateDrizzleSchema;
exports.generateDbIndex = generateDbIndex;
exports.generateDrizzleConfig = generateDrizzleConfig;
const utils_1 = require("../../../utils");
const DRIZZLE_FN = {
    string: 'text',
    text: 'text',
    number: 'numeric',
    boolean: 'boolean',
    date: 'date',
    datetime: 'timestamp',
    enum: 'text',
    reference: 'text',
};
function drizzleFn(dnaType) {
    return DRIZZLE_FN[dnaType] ?? 'text';
}
function columnExpr(attr) {
    const fn = drizzleFn(attr.type);
    const call = attr.type === 'datetime'
        ? `timestamp('${attr.name}', { withTimezone: true })`
        : `${fn}('${attr.name}')`;
    const primaryKey = attr.name === 'id' ? '.primaryKey()' : '';
    const notNull = attr.required ? '.notNull()' : '';
    const enumComment = attr.type === 'enum' && attr.values?.length
        ? ` // ${attr.values.join(' | ')}`
        : '';
    return `  ${attr.name}: ${call}${primaryKey}${notNull},${enumComment}`;
}
function tableBlock(noun) {
    const tableName = (0, utils_1.toTableName)(noun.name);
    const varName = (0, utils_1.toCamelCase)(noun.name) + 's';
    const attrs = noun.attributes ?? [];
    // Auto-add created_at / updated_at, but only if the resource didn't already
    // declare them — otherwise the operational author and the generator both
    // emit a column with the same name and tsc fails on the duplicate key.
    const declared = new Set(attrs.map((a) => a.name));
    const autoTimestamps = [];
    if (!declared.has('created_at')) {
        autoTimestamps.push(`  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),`);
    }
    if (!declared.has('updated_at')) {
        autoTimestamps.push(`  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),`);
    }
    const columns = [...attrs.map(columnExpr), ...autoTimestamps].join('\n');
    const comment = noun.description ? `// ${noun.description}\n` : '';
    return `${comment}export const ${varName} = pgTable('${tableName}', {\n${columns}\n})`;
}
function generateDrizzleSchema(nouns) {
    const usedFns = new Set(['timestamp']);
    for (const noun of nouns) {
        for (const attr of noun.attributes ?? []) {
            usedFns.add(drizzleFn(attr.type));
        }
    }
    const imports = [...usedFns].sort().join(', ');
    const tables = nouns.map(tableBlock).join('\n\n');
    return `import { pgTable, ${imports} } from 'drizzle-orm/pg-core'\n\n${tables}\n`;
}
function generateDbIndex() {
    return `import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
`;
}
function generateDrizzleConfig() {
    return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
`;
}
//# sourceMappingURL=drizzle.js.map