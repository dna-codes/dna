"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeed = generateSeed;
const naming_1 = require("./naming");
function nounSeedBlock(noun) {
    const examples = noun.examples;
    if (!examples?.length)
        return '';
    const modelName = noun.name;
    const lines = [`    # Seed ${modelName} records`];
    for (const [i, ex] of examples.entries()) {
        const id = ex.id ?? `seed-${(0, naming_1.toSnakeCase)(noun.name)}-${i + 1}`;
        const attrs = Object.entries(ex)
            .filter(([k]) => k !== 'id')
            .map(([k, v]) => `        ${k}=${typeof v === 'string' ? `"${v}"` : v},`)
            .join('\n');
        lines.push(`    existing = db.query(${modelName}).filter(${modelName}.id == "${id}").first()`);
        lines.push(`    if not existing:`);
        lines.push(`        db.add(${modelName}(`);
        lines.push(`            id="${id}",`);
        if (attrs)
            lines.push(attrs);
        lines.push(`        ))`);
        lines.push('');
    }
    return lines.join('\n');
}
function generateSeed(nouns) {
    const blocks = nouns.map(nounSeedBlock).filter(Boolean);
    const modelImports = nouns.map(n => `from app.models.${(0, naming_1.toSnakeCase)(n.name)} import ${n.name}`);
    if (!blocks.length) {
        return `"""Seed script generated from DNA examples — no example data found."""
`;
    }
    return `"""Seed script generated from DNA examples."""
from app.database import SessionLocal, engine, Base
${modelImports.join('\n')}


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
${blocks.join('\n')}
        db.commit()
        print("Seeded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
`;
}
//# sourceMappingURL=seed.js.map