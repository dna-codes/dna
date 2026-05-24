"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const bookSample = {
    id: 'book-1',
    title: 'The Hobbit',
    status: 'active',
    published_at: '1937-09-21T00:00:00Z',
    rating: 4.9,
    in_stock: true,
    tags: ['fantasy', 'classic'],
    author: {
        id: 'author-1',
        name: 'J. R. R. Tolkien',
    },
    reviews: [
        { rating: 5, comment: 'Brilliant.', reviewer: 'Alice' },
        { rating: 4, comment: 'Charming.', reviewer: 'Bob' },
    ],
};
describe('@dna-codes/dna-input-json', () => {
    describe('root resource', () => {
        it('names the root resource from options.name', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const root = operational.domain.resources.find((r) => r.name === 'Book');
            expect(root).toBeDefined();
        });
        it('infers scalar attribute types from values', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const book = operational.domain.resources.find((r) => r.name === 'Book');
            const byName = Object.fromEntries(book.attributes.map((a) => [a.name, a]));
            expect(byName.id.type).toBe('string');
            expect(byName.rating.type).toBe('number');
            expect(byName.in_stock.type).toBe('boolean');
            expect(byName.published_at.type).toBe('datetime');
        });
        it('detects date-only strings', () => {
            const { operational } = (0, index_1.parse)({ due_date: '2026-12-31' }, { name: 'Thing' });
            const attr = operational.domain.resources[0].attributes.find((a) => a.name === 'due_date');
            expect(attr?.type).toBe('date');
        });
        it('drops arrays of scalars — no faithful single-attribute representation in DNA', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const tags = operational.domain.resources.find((r) => r.name === 'Book')
                .attributes.find((a) => a.name === 'tags');
            expect(tags).toBeUndefined();
        });
    });
    describe('nested objects → child resource + one-to-one relationship', () => {
        it('extracts a child Resource from a nested object', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const author = operational.domain.resources.find((r) => r.name === 'Author');
            expect(author).toBeDefined();
            expect(author.attributes.map((a) => a.name).sort()).toEqual(['id', 'name']);
        });
        it('adds a reference attribute on the parent resource', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const book = operational.domain.resources.find((r) => r.name === 'Book');
            const authorAttr = book.attributes.find((a) => a.name === 'author');
            expect(authorAttr).toEqual({ name: 'author', type: 'reference', resource: 'Author' });
        });
        it('emits a one-to-one relationship', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const rel = operational.relationships?.find((r) => r.name === 'Book.author');
            expect(rel).toMatchObject({
                name: 'Book.author',
                from: 'Book',
                to: 'Author',
                attribute: 'author',
                cardinality: 'one-to-one',
                type: 'relationship',
                version: expect.any(String),
                id: expect.any(String),
            });
        });
    });
    describe('arrays of objects → child resource + one-to-many relationship', () => {
        it('singularizes array keys to derive the child resource name', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const review = operational.domain.resources.find((r) => r.name === 'Review');
            expect(review).toBeDefined();
            expect(review.attributes.map((a) => a.name).sort()).toEqual([
                'comment',
                'rating',
                'reviewer',
            ]);
        });
        it('emits a one-to-many relationship', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const rel = operational.relationships?.find((r) => r.name === 'Book.reviews');
            expect(rel?.cardinality).toBe('one-to-many');
            expect(rel?.from).toBe('Book');
            expect(rel?.to).toBe('Review');
        });
        it('merges attribute keys across all array items', () => {
            const { operational } = (0, index_1.parse)({
                id: 'x',
                items: [
                    { a: 1, b: 'x' },
                    { a: 2, c: true },
                ],
            }, { name: 'Container' });
            const item = operational.domain.resources.find((r) => r.name === 'Item');
            expect(item.attributes.map((a) => a.name).sort()).toEqual(['a', 'b', 'c']);
        });
    });
    describe('singularization', () => {
        it('handles -ies → -y', () => {
            const { operational } = (0, index_1.parse)({ id: 'x', categories: [{ name: 'fiction' }] }, { name: 'Book' });
            expect(operational.domain.resources.map((r) => r.name).sort()).toEqual(['Book', 'Category']);
        });
        it('does not strip -ss', () => {
            const { operational } = (0, index_1.parse)({ id: 'x', address: { street: '1 Main' } }, { name: 'Order' });
            expect(operational.domain.resources.map((r) => r.name).sort()).toEqual(['Address', 'Order']);
        });
        it('honors resourceNameFromKey override', () => {
            // Override must return PascalCase names — Resource.name pattern in the
            // schema is `^[A-Z][a-zA-Z0-9]*$`. The pre-builder walker silently
            // emitted invalid Resources when given a lowercase override; the
            // builder API validates by default and surfaces the bug.
            const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);
            const { operational } = (0, index_1.parse)(bookSample, {
                name: 'Book',
                resourceNameFromKey: (k) => (k === 'author' ? 'Person' : pascal(k)),
            });
            expect(operational.domain.resources.find((r) => r.name === 'Person')).toBeDefined();
        });
    });
    describe('inputs', () => {
        it('accepts a top-level array and merges items for the root resource', () => {
            const { operational } = (0, index_1.parse)([
                { id: 1, title: 'a' },
                { id: 2, title: 'b', subtitle: 'bb' },
            ], { name: 'Book' });
            const book = operational.domain.resources.find((r) => r.name === 'Book');
            expect(book.attributes.map((a) => a.name).sort()).toEqual(['id', 'subtitle', 'title']);
        });
        it('rejects non-object/non-array input', () => {
            expect(() => (0, index_1.parse)('nope', { name: 'X' })).toThrow(/object or array/);
        });
    });
    describe('domain', () => {
        it('defaults the domain name to a lowercased root resource name', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            expect(operational.domain.name).toBe('book');
        });
        it('honors an explicit domain option', () => {
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book', domain: 'shop.books' });
            expect(operational.domain.name).toBe('shop.books');
        });
    });
    /**
     * Drift detection: validate parse() output against the canonical operational
     * JSON Schema from @dna-codes/dna-schemas (loaded via @dna-codes/dna-core). If the
     * schema adds a required field or tightens a constraint, this test fails —
     * forcing the adapter to stay in sync.
     */
    describe('schema conformance', () => {
        it('emits operational DNA that validates against @dna-codes/dna-schemas', () => {
            // Lazy require to keep @dna-codes/dna-core a devDep (not a runtime dep).
            const { DnaValidator } = require('@dna-codes/dna-core');
            const { operational } = (0, index_1.parse)(bookSample, { name: 'Book' });
            const result = new DnaValidator().validate(operational, 'https://dna.codes/schemas/operational');
            if (!result.valid) {
                throw new Error(`input-json output failed operational schema validation:\n${JSON.stringify(result.errors, null, 2)}`);
            }
        });
    });
});
//# sourceMappingURL=index.test.js.map