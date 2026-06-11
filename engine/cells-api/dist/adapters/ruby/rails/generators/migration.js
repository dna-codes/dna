"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMigration = generateMigration;
exports.migrationFileName = migrationFileName;
const naming_1 = require("./naming");
function columnLine(attr) {
    if (attr.name === 'id')
        return ''; // handled by primary key
    const colType = (0, naming_1.toRailsColumnType)(attr.type);
    const nullable = attr.required ? ', null: false' : '';
    return `      t.${colType} :${attr.name}${nullable}`;
}
function generateMigration(nouns, timestamp) {
    const className = 'CreateDnaTables';
    const tableBlocks = [];
    for (const noun of nouns) {
        const tableName = (0, naming_1.toTableName)(noun.name);
        const attrs = (noun.attributes ?? []).filter((a) => a.name !== 'id');
        const comment = noun.description ? `      # ${noun.description}` : '';
        const columns = attrs.map(columnLine).filter(Boolean);
        const block = [
            `    create_table :${tableName}, id: false do |t|`,
            `      t.string :id, null: false, primary_key: true`,
            ...(comment ? [comment] : []),
            ...columns,
            `      t.timestamps`,
            `    end`,
        ].join('\n');
        tableBlocks.push(block);
    }
    return `class ${className} < ActiveRecord::Migration[7.1]
  def change
${tableBlocks.join('\n\n')}
  end
end
`;
}
/** Generate a migration filename: YYYYMMDDHHMMSS_create_dna_tables.rb */
function migrationFileName(timestamp) {
    return `${timestamp}_create_dna_tables.rb`;
}
//# sourceMappingURL=migration.js.map