import { DnaInput } from './types'

/**
 * Stable per-primitive UUIDs for the bookshop fixture. Keyed by an opaque
 * label so adapters that compare fixture renders across runs stay
 * deterministic. (The bookshop is a renderer fixture, not a schema fixture
 * — these ids are convenience, not part of any contract.)
 */
const ID = {
  book: '11111111-1111-4111-8111-000000000001',
  author: '11111111-1111-4111-8111-000000000002',
  employee: '11111111-1111-4111-8111-000000000003',
  shop: '11111111-1111-4111-8111-000000000004',
  editor: '11111111-1111-4111-8111-000000000005',
  employeeEditor: '11111111-1111-4111-8111-000000000006',
  bookPublish: '11111111-1111-4111-8111-000000000007',
  bookRetire: '11111111-1111-4111-8111-000000000008',
  publishFlowStart: '11111111-1111-4111-8111-000000000009',
  publishAccess: '11111111-1111-4111-8111-000000000010',
  bookIsDraft: '11111111-1111-4111-8111-000000000011',
  publishTrigger: '11111111-1111-4111-8111-000000000012',
  bookAuthorRel: '11111111-1111-4111-8111-000000000013',
  reviewBook: '11111111-1111-4111-8111-000000000014',
  approveBook: '11111111-1111-4111-8111-000000000015',
  rejectBook: '11111111-1111-4111-8111-000000000016',
  publishFlow: '11111111-1111-4111-8111-000000000017',
}

/**
 * Canonical bookshop domain used across adapter tests. Populates every
 * operational primitive any adapter currently consumes so renderers can
 * be asserted against the same input.
 */
export const bookshopInput: DnaInput = {
  operational: {
    domain: {
      name: 'shop',
      path: 'shop.books',
      description: 'Tiny bookshop domain — canonical fixture for adapter tests.',
      resources: [
        {
          id: ID.book,
          type: 'resource',
          version: '1',
          name: 'Book',
          description: 'A book for sale.',
          attributes: [
            { name: 'id', type: 'string', required: true, description: 'Unique identifier' },
            { name: 'title', type: 'string', required: true, description: 'Book title' },
            { name: 'author_id', type: 'reference', required: true, description: 'Reference to Author' },
            {
              name: 'status',
              type: 'enum',
              required: true,
              description: 'draft | active | retired',
            },
          ],
          actions: [
            { name: 'Publish', description: 'Publish a draft book.', type: 'write' },
            { name: 'Retire', description: 'Retire an active book.', type: 'destructive' },
          ],
        },
        {
          id: ID.author,
          type: 'resource',
          version: '1',
          name: 'Author',
          description: "A book's author.",
          attributes: [
            { name: 'id', type: 'string', required: true },
            { name: 'name', type: 'string', required: true },
          ],
        },
      ],
      persons: [
        {
          id: ID.employee,
          type: 'person',
          version: '1',
          name: 'Employee',
          description: 'Internal worker at the shop.',
        },
      ],
      groups: [
        {
          id: ID.shop,
          type: 'group',
          version: '1',
          name: 'Shop',
          description: 'The bookshop itself — the work-unit Editors are scoped to.',
        },
      ],
      roles: [
        {
          id: ID.editor,
          type: 'role',
          version: '1',
          name: 'Editor',
          description: 'Reviews and publishes books within a Shop.',
          scope: 'Shop',
        },
      ],
    },
    memberships: [
      {
        id: ID.employeeEditor,
        type: 'membership',
        version: '1',
        name: 'EmployeeEditor',
        description: 'Employees may hold the Editor role within a Shop.',
        person: 'Employee',
        role: 'Editor',
      },
    ],
    operations: [
      {
        id: ID.bookPublish,
        type: 'operation',
        version: '1',
        name: 'Book.Publish',
        target: 'Book',
        action: 'Publish',
        description: 'Publish a draft book to the storefront.',
        changes: [{ attribute: 'status', set: 'active' }],
      },
      {
        id: ID.bookRetire,
        type: 'operation',
        version: '1',
        name: 'Book.Retire',
        target: 'Book',
        action: 'Retire',
        description: 'Remove an active book from sale.',
      },
      {
        id: ID.publishFlowStart,
        type: 'operation',
        version: '1',
        name: 'PublishFlow.Start',
        target: 'PublishFlow',
        action: 'Start',
        description: 'An Editor kicks off the PublishFlow SOP for a draft book.',
      },
    ],
    rules: [
      {
        id: ID.publishAccess,
        type: 'rule',
        version: '1',
        name: 'BookPublishAccess',
        operation: 'Book.Publish',
        subtype: 'access',
        allow: [{ role: 'Editor' }],
      },
      {
        id: ID.bookIsDraft,
        type: 'rule',
        version: '1',
        name: 'BookIsDraft',
        operation: 'Book.Publish',
        subtype: 'condition',
        conditions: [{ attribute: 'book.status', operator: 'eq', value: 'draft' }],
      },
    ],
    triggers: [
      {
        id: ID.publishTrigger,
        type: 'trigger',
        version: '1',
        name: 'BookPublishUser',
        operation: 'Book.Publish',
        source: 'user',
        description: 'Editor publishes a book.',
      },
    ],
    relationships: [
      {
        id: ID.bookAuthorRel,
        type: 'relationship',
        version: '1',
        name: 'Book.author',
        from: 'Book',
        to: 'Author',
        attribute: 'author_id',
        cardinality: 'many-to-one',
      },
    ],
    tasks: [
      {
        id: ID.reviewBook,
        type: 'task',
        version: '1',
        name: 'review-book',
        actor: 'Editor',
        operation: 'Book.Publish',
        description: 'Editor reviews the draft.',
      },
      {
        id: ID.approveBook,
        type: 'task',
        version: '1',
        name: 'approve-book',
        actor: 'Editor',
        operation: 'Book.Publish',
        description: 'Editor approves and publishes.',
      },
      {
        id: ID.rejectBook,
        type: 'task',
        version: '1',
        name: 'reject-book',
        actor: 'Editor',
        operation: 'Book.Retire',
        description: 'Editor rejects the draft.',
      },
    ],
    processes: [
      {
        id: ID.publishFlow,
        type: 'process',
        version: '1',
        name: 'PublishFlow',
        description: 'How a draft book becomes live.',
        operator: 'Editor',
        startStep: 'review',
        steps: [
          { id: 'review', task: 'review-book' },
          {
            id: 'approve',
            task: 'approve-book',
            depends_on: ['review'],
            conditions: ['BookIsDraft'],
            else: 'reject',
          },
          {
            id: 'reject',
            task: 'reject-book',
            depends_on: ['review'],
          },
        ],
      },
    ],
  },
  productApi: {
    namespace: {
      name: 'Bookshop',
      path: '/bookshop',
      description: 'Bookshop catalog and publishing endpoints.',
      domain: 'shop.books',
      resources: ['Book', 'Author'],
    },
    operations: [
      { resource: 'Book', action: 'List', name: 'Book.List' },
      { resource: 'Book', action: 'Get', name: 'Book.Get' },
      { resource: 'Book', action: 'Publish', name: 'Book.Publish' },
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/bookshop/books',
        operation: 'Book.List',
        description: 'List books in the catalog.',
        params: [
          { name: 'status', in: 'query', type: 'enum', values: ['draft', 'live', 'retired'] },
          { name: 'limit', in: 'query', type: 'number', description: 'Max rows returned (default 50).' },
        ],
        response: {
          name: 'BookListResponse',
          description: 'A page of books.',
          fields: [
            { name: 'items', type: 'reference', required: true, description: 'BookSummary[] (see components).' },
            { name: 'total', type: 'number', required: true },
          ],
        },
      },
      {
        method: 'GET',
        path: '/bookshop/books/:id',
        operation: 'Book.Get',
        description: 'Fetch a single book by ID.',
        params: [{ name: 'id', in: 'path', type: 'string', required: true, attribute: 'id' }],
        response: {
          name: 'BookResponse',
          description: 'A single book.',
          resource: 'Book',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'status', type: 'enum', values: ['draft', 'live', 'retired'], required: true },
          ],
        },
      },
      {
        method: 'POST',
        path: '/bookshop/books/:id/publish',
        operation: 'Book.Publish',
        description: 'Publish a draft book. Requires editorial approval per the PublishFlow Process.',
        params: [{ name: 'id', in: 'path', type: 'string', required: true, attribute: 'id' }],
        request: {
          name: 'PublishBookRequest',
          fields: [{ name: 'note', type: 'text', description: 'Optional editorial note.' }],
        },
        response: {
          name: 'BookResponse',
          description: 'The published book.',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
            { name: 'status', type: 'enum', values: ['draft', 'live', 'retired'], required: true },
          ],
        },
      },
    ],
  },
}
