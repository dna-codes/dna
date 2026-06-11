"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModel = generateModel;
exports.generateModelsInit = generateModelsInit;
const naming_1 = require("./naming");
function columnLine(attr) {
    if (attr.name === 'id')
        return '';
    const saType = (0, naming_1.toSqlalchemyType)(attr.type);
    const nullable = attr.required ? ', nullable=False' : '';
    return `    ${attr.name}: Mapped[${pythonMappedType(attr)}] = mapped_column(${saType}${nullable})`;
}
function pythonMappedType(attr) {
    const map = {
        string: 'str',
        text: 'str',
        number: 'float',
        boolean: 'bool',
        date: 'date',
        datetime: 'datetime',
        enum: 'str',
        reference: 'str',
    };
    const base = map[attr.type] ?? 'str';
    return attr.required ? base : `Optional[${base}]`;
}
function needsDateImport(attrs) {
    return attrs.some(a => a.type === 'date' || a.type === 'datetime');
}
function generateModel(noun) {
    const attrs = noun.attributes ?? [];
    const tableName = (0, naming_1.toTableName)(noun.name);
    const columns = attrs.filter((a) => a.name !== 'id').map(columnLine);
    const hasDate = needsDateImport(attrs);
    const comment = noun.description ? `    """${noun.description}"""\n` : '';
    const imports = [
        `from __future__ import annotations`,
        `from typing import Optional`,
    ];
    if (hasDate) {
        imports.push(`from datetime import date, datetime`);
    }
    imports.push(`from sqlalchemy import ${collectSaTypes(attrs)}`, `from sqlalchemy.orm import Mapped, mapped_column`, `from app.database import Base`);
    return `${imports.join('\n')}


class ${noun.name}(Base):
${comment}    __tablename__ = "${tableName}"

    id: Mapped[str] = mapped_column(String, primary_key=True)
${columns.join('\n')}
`;
}
function collectSaTypes(attrs) {
    const types = new Set(['String']);
    for (const attr of attrs) {
        if (attr.name === 'id')
            continue;
        types.add((0, naming_1.toSqlalchemyType)(attr.type));
    }
    return [...types].sort().join(', ');
}
/** Generate the models __init__.py that re-exports all models */
function generateModelsInit(nouns) {
    const imports = nouns.map(n => `from app.models.${(0, naming_1.toSnakeCase)(n.name)} import ${n.name}`);
    const all = nouns.map(n => `    "${n.name}",`);
    return `${imports.join('\n')}

__all__ = [
${all.join('\n')}
]
`;
}
//# sourceMappingURL=models.js.map