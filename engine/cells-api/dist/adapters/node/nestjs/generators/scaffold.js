"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDrizzleConfig = void 0;
exports.generatePackageJson = generatePackageJson;
exports.generateTsConfig = generateTsConfig;
exports.generateTsConfigBuild = generateTsConfigBuild;
exports.generateEnv = generateEnv;
function generatePackageJson(appName) {
    return JSON.stringify({
        name: appName,
        version: '0.0.1',
        scripts: {
            build: 'nest build',
            start: 'nest start',
            'start:dev': 'nest start --watch',
            'start:prod': 'node dist/main',
            'db:generate': 'drizzle-kit generate',
            'db:migrate': 'drizzle-kit migrate',
        },
        dependencies: {
            '@nestjs/common': '^10.0.0',
            '@nestjs/config': '^3.0.0',
            '@nestjs/core': '^10.0.0',
            '@nestjs/platform-express': '^10.0.0',
            '@nestjs/swagger': '^7.0.0',
            'class-transformer': '^0.5.0',
            'class-validator': '^0.14.0',
            'drizzle-orm': '^0.30.0',
            jsonwebtoken: '^9.0.0',
            'jwks-rsa': '^3.1.0',
            pg: '^8.11.0',
            'reflect-metadata': '^0.1.13',
            rxjs: '^7.8.1',
        },
        devDependencies: {
            '@nestjs/cli': '^10.0.0',
            '@types/jsonwebtoken': '^9.0.0',
            '@types/node': '^20.0.0',
            '@types/pg': '^8.10.0',
            'drizzle-kit': '^0.21.0',
            typescript: '^5.4.0',
        },
    }, null, 2) + '\n';
}
function generateTsConfig() {
    return JSON.stringify({
        compilerOptions: {
            module: 'commonjs',
            declaration: true,
            removeComments: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            allowSyntheticDefaultImports: true,
            target: 'ES2020',
            sourceMap: true,
            outDir: './dist',
            rootDir: './src',
            baseUrl: './',
            incremental: true,
            skipLibCheck: true,
            strictNullChecks: false,
            noImplicitAny: false,
        },
    }, null, 2) + '\n';
}
function generateTsConfigBuild() {
    return JSON.stringify({
        extends: './tsconfig.json',
        exclude: ['node_modules', 'test', 'dist', '**/*spec.ts', 'drizzle.config.ts'],
    }, null, 2) + '\n';
}
function generateEnv(port = 3000) {
    return `PORT=${port}
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lending
JWT_SECRET=dev-secret
`;
}
var drizzle_1 = require("../../shared/drizzle");
Object.defineProperty(exports, "generateDrizzleConfig", { enumerable: true, get: function () { return drizzle_1.generateDrizzleConfig; } });
//# sourceMappingURL=scaffold.js.map