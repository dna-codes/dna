"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModel = generateModel;
function validationLines(attrs) {
    const lines = [];
    for (const attr of attrs) {
        if (attr.name === 'id')
            continue;
        if (attr.required) {
            lines.push(`  validates :${attr.name}, presence: true`);
        }
        if (attr.type === 'enum' && attr.values?.length) {
            lines.push(`  validates :${attr.name}, inclusion: { in: [${attr.values.map(v => `'${v}'`).join(', ')}] }, allow_nil: ${attr.required ? 'false' : 'true'}`);
        }
    }
    return lines;
}
function generateModel(noun) {
    const attrs = noun.attributes ?? [];
    const validations = validationLines(attrs);
    const comment = noun.description ? `# ${noun.description}\n` : '';
    return `${comment}class ${noun.name} < ApplicationRecord
  self.primary_key = 'id'
${validations.length ? '\n' + validations.join('\n') + '\n' : ''}end
`;
}
//# sourceMappingURL=model.js.map