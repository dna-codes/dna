"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDockerCompose = generateDockerCompose;
function generateDockerCompose(adapterConfig, constructConfig) {
    const database = adapterConfig.database;
    const version = constructConfig.version ?? '16';
    const port = adapterConfig.port ?? 5433;
    return `services:
  db:
    image: postgres:${version}-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${database}
    ports:
      - "${port}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/scripts:/docker-entrypoint-initdb.d

volumes:
  pgdata:
`;
}
//# sourceMappingURL=docker-compose.js.map