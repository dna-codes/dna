/**
 * Generates the Fastify route registrar. Where the express adapter returns a
 * Router and uses chained middleware, Fastify uses route options + lifecycle
 * hooks: `preHandler` runs before the handler, in array order, exactly like
 * Express middleware chains. The auth hook → request validator → rule
 * validator order is preserved.
 *
 * Path conversion: DNA endpoints use `/:id`; Fastify accepts the same syntax,
 * no rewrite needed (unlike OpenAPI's `{id}`).
 */
export declare function generateRouter(): string;
//# sourceMappingURL=router.d.ts.map