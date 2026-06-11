"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeeds = generateSeeds;
const naming_1 = require("./naming");
function nounSeedBlock(noun) {
    const examples = noun.examples;
    if (!examples?.length)
        return '';
    const modelName = noun.name;
    const lines = [`# Seed ${modelName} records`];
    for (const ex of examples) {
        const attrs = Object.entries(ex)
            .map(([k, v]) => `  ${k}: ${typeof v === 'string' ? `'${v}'` : v}`)
            .join(",\n");
        lines.push(`${modelName}.find_or_create_by!(id: '${ex.id ?? `seed-${(0, naming_1.toSnakeCase)(noun.name)}-${examples.indexOf(ex) + 1}`}') do |r|`);
        lines.push(`${attrs}`);
        lines.push(`end`);
        lines.push('');
    }
    return lines.join('\n');
}
function generateSeeds(nouns) {
    const blocks = nouns.map(nounSeedBlock).filter(Boolean);
    if (!blocks.length) {
        return `# Seeds generated from DNA examples.\n# No example data found in Operational DNA.\n`;
    }
    return `# Seeds generated from DNA examples.\n\n${blocks.join('\n')}`;
}
//# sourceMappingURL=seeds.js.map