/**
 * Generates /auth/login and /auth/me endpoints for built-in JWT auth.
 *
 * User credentials load from DEMO_USERS_JSON at startup — a JSON array of
 * { email, password, roles } entries, with password in plaintext (hashed
 * in-memory via bcrypt on boot). If the env var is missing or malformed,
 * /auth/login fails closed with 503 and no users are loaded. This keeps
 * demo passwords out of the shipped source — in dev, docker-compose
 * provides a default DEMO_USERS_JSON; in prod, the operator provisions
 * it (e.g. via AWS Secrets Manager → ECS secrets reference).
 */
export declare function generateAuthRoutes(): string;
//# sourceMappingURL=auth-routes.d.ts.map