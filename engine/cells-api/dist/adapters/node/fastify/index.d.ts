import { ApiCellAdapter } from '../../../types';
export type ComputeTarget = 'ecs' | 'lambda';
/**
 * Fastify api-cell adapter. The same generated app runs as either:
 *   - an ECS-hosted service (`compute: 'ecs'`, the default) — Fastify listens
 *     on `:PORT` exactly like the express adapter; or
 *   - an AWS Lambda function (`compute: 'lambda'`) — Fastify is wrapped with
 *     `@fastify/aws-lambda` in streaming mode and exported as a Lambda
 *     handler, no listener.
 *
 * 95% of the generated files are identical across compute targets. Only
 * `src/main.ts` (ECS) vs `src/handler.ts` (Lambda), `package.json`
 * dependencies, and a few build settings differ.
 *
 * OpenAPI-as-contract seam — partial. The runtime spec served at `/api-json`
 * is rendered by `@dna-codes/dna-output-openapi` (see `generators/openapi.ts`)
 * — DNA → OpenAPI translation lives upstream, not in cba. Route registration
 * (`registerRoutes`) still consumes `product.api.json` directly; flipping it
 * to consume the OpenAPI document is a separate, larger change (param
 * parsing, validation middleware, error shapes) deferred to a follow-on.
 * Both compute targets currently read `product.api.json` for routing.
 */
export declare const generate: ApiCellAdapter['generate'];
//# sourceMappingURL=index.d.ts.map