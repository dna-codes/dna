"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateController = generateController;
const utils_1 = require("../../../../utils");
const dto_1 = require("./dto");
const HTTP_DECORATOR = {
    GET: 'Get',
    POST: 'Post',
    PUT: 'Put',
    PATCH: 'Patch',
    DELETE: 'Delete',
};
function resourceBasePath(namespace, resourceName) {
    return `${(0, utils_1.stripLeadingSlash)(namespace.path)}/${resourceName.toLowerCase()}s`;
}
function relativeEndpointPath(endpointPath, basePath) {
    return endpointPath
        .replace(`/${basePath}`, '')
        .replace(`${basePath}`, '')
        .replace(/^\//, '');
}
function generateController(resource, endpoints, _operations, rules, namespace) {
    const basePath = resourceBasePath(namespace, resource.name);
    const fileName = (0, utils_1.toFileName)(resource.name);
    const className = `${resource.name}sController`;
    const serviceName = `${resource.name}sService`;
    const serviceVar = `${(0, utils_1.toCamelCase)(resource.name)}sService`;
    const usedHttpDecorators = new Set();
    const usedParamDecorators = new Set();
    const dtosNeeded = [];
    const methods = [];
    for (const ep of endpoints) {
        const action = ep.operation.split('.')[1];
        const methodName = (0, utils_1.toCamelCase)(action);
        const httpDec = HTTP_DECORATOR[ep.method];
        usedHttpDecorators.add(httpDec);
        const relPath = relativeEndpointPath(ep.path, basePath);
        const pathDec = relPath ? `@${httpDec}('${relPath}')` : `@${httpDec}()`;
        const accessRule = rules.find(r => r.operation === ep.operation && r.type === 'access');
        const allowEntries = accessRule?.allow ?? [];
        const roles = allowEntries.map(a => a.role).filter((r) => !!r);
        const requiresOwnership = allowEntries.some(a => a.ownership);
        const hasFlags = allowEntries.some(a => Array.isArray(a.flags) && a.flags.length > 0);
        const pathParams = (ep.params ?? []).filter(p => p.in === 'path');
        const queryParams = (ep.params ?? []).filter(p => p.in === 'query');
        if (pathParams.length)
            usedParamDecorators.add('Param');
        if (queryParams.length)
            usedParamDecorators.add('Query');
        const hasDtoBody = !!ep.request?.fields?.length;
        if (hasDtoBody) {
            usedParamDecorators.add('Body');
            dtosNeeded.push({ action, resource: resource.name });
        }
        const params = [
            ...pathParams.map(p => `@Param('${p.name}') ${p.name}: string`),
            ...queryParams.map(p => `@Query('${p.name}') ${p.name}?: string`),
            ...(hasDtoBody ? [`@Body() dto: ${(0, dto_1.dtoClassName)(action, resource.name)}`] : []),
        ];
        const serviceArgs = [
            ...pathParams.map(p => p.name),
            ...(queryParams.length
                ? [`{ ${queryParams.map(p => p.name).join(', ')} }`]
                : []),
            ...(hasDtoBody ? ['dto'] : []),
        ];
        const summary = ep.description ?? ep.operation;
        const apiQueryDecorators = queryParams.map(p => `  @ApiQuery({ name: '${p.name}', required: false })`);
        // When any allow entry has flags we emit @AccessAllow with the full
        // structured entries (preserves within-entry AND / cross-entry OR).
        // Otherwise we keep @Roles for backward-compat and simpler generated code.
        const allowDec = hasFlags
            ? `  @AccessAllow(${JSON.stringify(allowEntries)})`
            : null;
        const rolesDec = !hasFlags && roles.length
            ? `  @Roles(${roles.map(r => `'${r}'`).join(', ')})`
            : null;
        const lines = [
            `  // ${ep.operation}${ep.description ? `: ${ep.description}` : ''}`,
            `  @ApiOperation({ summary: '${summary.replace(/'/g, "\\'")}' })`,
            `  @ApiBearerAuth()`,
            ...apiQueryDecorators,
            `  @UseGuards(AuthGuard)`,
            ...(allowDec ? [allowDec] : []),
            ...(rolesDec ? [rolesDec] : []),
            ...(requiresOwnership ? ['  @RequiresOwnership()'] : []),
            `  ${pathDec}`,
            `  ${methodName}(${params.join(', ')}) {`,
            `    return this.${serviceVar}.${methodName}(${serviceArgs.join(', ')})`,
            `  }`,
        ];
        methods.push(lines.join('\n'));
    }
    const nestImports = [
        'Controller', 'UseGuards',
        ...usedHttpDecorators,
        ...usedParamDecorators,
    ].sort();
    const dtoImports = dtosNeeded.map(({ action, resource: res }) => `import { ${(0, dto_1.dtoClassName)(action, res)} } from './dto/${(0, dto_1.dtoFileName)(action, res)}'`);
    return [
        `import { ${nestImports.join(', ')} } from '@nestjs/common'`,
        `import { ApiOperation, ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger'`,
        `import { AuthGuard } from '../auth/auth.guard'`,
        `import { Roles, RequiresOwnership, AccessAllow } from '../auth/roles.decorator'`,
        `import { ${serviceName} } from './${fileName}.service'`,
        ...dtoImports,
        '',
        `@ApiTags('${resource.name}s')`,
        `@Controller('${basePath}')`,
        `export class ${className} {`,
        `  constructor(private readonly ${serviceVar}: ${serviceName}) {}`,
        '',
        methods.join('\n\n'),
        '}',
        '',
    ].join('\n');
}
//# sourceMappingURL=controller.js.map