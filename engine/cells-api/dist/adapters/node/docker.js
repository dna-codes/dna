"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDockerfile = generateDockerfile;
exports.generateDockerIgnore = generateDockerIgnore;
function generateDockerfile(port = 3000) {
    // Use `npm install` (not `npm ci`) because the api-cell is regenerated
    // frequently and ships without a checked-in package-lock.json. `npm ci`
    // would fail on first build with no lock file present.
    return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run db:generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
EXPOSE ${port}
CMD ["node", "dist/main"]
`;
}
function generateDockerIgnore() {
    return `node_modules
dist
.env*
*.log
`;
}
//# sourceMappingURL=docker.js.map