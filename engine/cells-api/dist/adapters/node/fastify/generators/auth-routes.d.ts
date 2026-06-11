/**
 * Generates /auth/login and /auth/me endpoints for built-in JWT auth as a
 * Fastify plugin. The express variant uses an Express Router; here we export
 * an async function that registers the same routes onto a Fastify instance.
 *
 * Demo user loading + bcrypt hashing semantics match the express adapter
 * exactly — DEMO_USERS_JSON env var, fail-closed with 503 if missing or
 * malformed, no plaintext passwords retained after boot.
 */
export declare function generateAuthRoutes(): string;
//# sourceMappingURL=auth-routes.d.ts.map