import { Namespace } from '../../../../types';
/**
 * ECS entrypoint: builds Fastify, registers routes, calls listen(). Mirrors
 * the express adapter's main.ts: hot DNA reload via fs.watch, Redoc at
 * /docs, /api-json for the spec.
 *
 * Docs strategy (see openspec change `fix-fastify-adapter-swagger-ui-wiring`):
 * Redoc only. We do NOT use `@fastify/swagger` or `@fastify/swagger-ui`, and
 * we do NOT hand-roll a Swagger UI page. Reasons:
 *   - The api-cell builds the OpenAPI document directly from DNA; there are
 *     no route schemas for `@fastify/swagger` to introspect, so its
 *     `mode: 'static'` path was the only useful seam — and it captures the
 *     doc at registration, turning the plugin into dead weight that has to be
 *     re-fed via decorator overrides.
 *   - `@fastify/swagger-ui@^5` force-resolves `<routePrefix>/json` through
 *     `app.swagger()`, ignoring `uiConfig.url`. That was the proximate cause
 *     of the "definition does not specify a valid version field" error the
 *     change fixes; any reintroduction of the plugin pair re-introduces it.
 *   - Redoc already renders the same OpenAPI doc with a built-in
 *     "Request samples" panel (curl + copy button) out of the box, so a
 *     second renderer added no real value to justify the extra HTML/CDN
 *     surface.
 * Two plugin majors leave the dep set; one renderer (Redoc) remains, served
 * from CDN at /docs.
 */
export declare function generateMain(namespace: Namespace, authMode?: string): string;
/**
 * Lambda entrypoint: builds Fastify once at cold start, wraps it with
 * @fastify/aws-lambda in streaming mode (`awslambda.streamifyResponse`), and
 * exports the handler for the Function URL with invoke_mode = RESPONSE_STREAM.
 *
 * SSE compatibility: Fastify routes write SSE via reply.raw.write(); the
 * streaming wrapper passes those writes straight through to the Function URL
 * response stream. CloudFront forwards the stream untouched when its cache
 * behavior is set to Managed-CachingDisabled (terraform-aws emits that).
 *
 * OpenAPI-as-contract seam — partial:
 * - The runtime spec served at /api-json is rendered by
 *   @dna-codes/dna-output-openapi (see ./interpreter/openapi). DNA → OpenAPI
 *   translation lives upstream now.
 * - Route registration (registerRoutes) still consumes product.api.json
 *   directly. Flipping it to consume the OpenAPI document is a separate,
 *   larger change (param parsing, validation middleware, error shapes)
 *   deferred to a follow-on. The loadDNA() function below is still the
 *   swap point for that future change.
 */
export declare function generateLambdaHandler(namespace: Namespace, authMode?: string): string;
//# sourceMappingURL=main.d.ts.map