"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const scaffold_1 = require("./generators/scaffold");
const docker_compose_1 = require("./generators/docker-compose");
const init_sql_1 = require("./generators/init-sql");
function write(outputDir, relPath, content) {
    const fullPath = path.join(outputDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
}
/**
 * db-cell (postgres) is infrastructure-only. It provisions the database and
 * the application role via postgres's own init scripts. It does NOT own
 * application tables — schema migrations, seeds, and queries are owned by
 * api-cell via drizzle, connecting as app_role.
 */
const generate = (_core, adapterConfig, constructConfig, outputDir) => {
    write(outputDir, 'docker-compose.yml', (0, docker_compose_1.generateDockerCompose)(adapterConfig, constructConfig));
    write(outputDir, 'docker/scripts/init.sql', (0, init_sql_1.generateInitSql)(adapterConfig));
    write(outputDir, '.env', (0, scaffold_1.generateEnv)(adapterConfig));
    write(outputDir, 'README.md', (0, scaffold_1.generateReadme)(adapterConfig));
};
exports.generate = generate;
//# sourceMappingURL=index.js.map