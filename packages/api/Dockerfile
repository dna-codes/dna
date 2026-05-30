# syntax=docker/dockerfile:1
#
# @dna-codes/dna-api — multi-stage build.
#
# The package depends on three workspace siblings (core, schemas,
# adapters, ingest) so we build inside the full monorepo context. Build
# context MUST be the repo root: `docker build -f packages/api/Dockerfile .`.
#
# Final image runs `node packages/api/bin/dna-api.js serve` and reads
# all configuration from environment variables. Local-dev only — no TLS,
# no secrets management, no readiness probes beyond /healthz.

FROM node:20-alpine AS deps
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/schemas/package.json packages/schemas/
COPY packages/core/package.json packages/core/
COPY packages/ingest/package.json packages/ingest/
COPY packages/adapters/package.json packages/adapters/
COPY packages/api/package.json packages/api/

RUN npm ci --workspaces --include-workspace-root


FROM deps AS build
WORKDIR /repo

COPY packages/schemas packages/schemas
COPY packages/core packages/core
COPY packages/ingest packages/ingest
COPY packages/adapters packages/adapters
COPY packages/api packages/api

RUN npm run build --workspace @dna-codes/dna-core \
 && npm run build --workspace @dna-codes/dna-ingest \
 && npm run build --workspace @dna-codes/dna-adapters \
 && npm run build --workspace @dna-codes/dna-api


FROM node:20-alpine AS runtime
WORKDIR /repo

# Copy the full installed node_modules tree plus every workspace package's
# manifest and dist. We keep package.json so subpath exports resolve at
# runtime, and dist so the compiled JS is reachable.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/packages/schemas/package.json packages/schemas/package.json
COPY --from=build /repo/packages/schemas/operational packages/schemas/operational
COPY --from=build /repo/packages/schemas/product packages/schemas/product
COPY --from=build /repo/packages/schemas/technical packages/schemas/technical
COPY --from=build /repo/packages/core/package.json packages/core/package.json
COPY --from=build /repo/packages/core/dist packages/core/dist
COPY --from=build /repo/packages/ingest/package.json packages/ingest/package.json
COPY --from=build /repo/packages/ingest/dist packages/ingest/dist
COPY --from=build /repo/packages/adapters/package.json packages/adapters/package.json
COPY --from=build /repo/packages/adapters/dist packages/adapters/dist
COPY --from=build /repo/packages/api/package.json packages/api/package.json
COPY --from=build /repo/packages/api/dist packages/api/dist
COPY --from=build /repo/packages/api/bin packages/api/bin

EXPOSE 4000

# `--init` would be nicer; alpine's default PID 1 works for our needs
# because we install signal handlers in src/cli.ts.
CMD ["node", "packages/api/bin/dna-api.js", "serve"]
