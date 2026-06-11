"use strict";
/**
 * FastAPI generates OpenAPI specs natively at /docs and /openapi.json.
 * This generator produces a static openapi.json for reference/docs tooling,
 * matching the same output pattern as the Rails adapter.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenApiSpec = generateOpenApiSpec;
function fieldToSchema(field) {
    const schema = {};
    const typeMap = {
        string: 'string',
        text: 'string',
        number: 'number',
        boolean: 'boolean',
        date: 'string',
        datetime: 'string',
        enum: 'string',
        reference: 'string',
    };
    schema.type = typeMap[field.type] ?? 'string';
    if (field.type === 'date')
        schema.format = 'date';
    if (field.type === 'datetime')
        schema.format = 'date-time';
    if (field.type === 'enum' && field.values?.length)
        schema.enum = field.values;
    return schema;
}
function buildRequestBody(ep) {
    if (!ep.request?.fields?.length)
        return undefined;
    const properties = {};
    const required = [];
    for (const f of ep.request.fields) {
        properties[f.name] = fieldToSchema(f);
        if (f.required)
            required.push(f.name);
    }
    return {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties,
                    ...(required.length ? { required } : {}),
                },
            },
        },
    };
}
function buildResponses(ep) {
    const successCode = ep.method === 'POST' ? '201' : '200';
    const resp = {
        [successCode]: { description: ep.description ?? 'Success' },
    };
    if (ep.response?.fields?.length) {
        const properties = {};
        for (const f of ep.response.fields) {
            properties[f.name] = fieldToSchema(f);
        }
        resp[successCode] = {
            description: ep.description ?? 'Success',
            content: {
                'application/json': {
                    schema: { type: 'object', properties },
                },
            },
        };
    }
    return resp;
}
function fastapiPath(epPath) {
    return epPath.replace(/:(\w+)/g, '{$1}');
}
function generateOpenApiSpec(api) {
    const paths = {};
    for (const ep of api.endpoints) {
        const oaPath = fastapiPath(ep.path);
        if (!paths[oaPath])
            paths[oaPath] = {};
        const operation = {
            summary: ep.description ?? ep.operation,
            operationId: ep.operation,
            tags: [ep.operation.split('.')[0]],
            responses: buildResponses(ep),
            security: [{ bearerAuth: [] }],
        };
        const parameters = [];
        for (const p of ep.params ?? []) {
            parameters.push({
                name: p.name,
                in: p.in,
                required: p.required ?? (p.in === 'path'),
                schema: { type: p.type === 'number' ? 'integer' : 'string' },
                ...(p.description ? { description: p.description } : {}),
            });
        }
        if (parameters.length)
            operation.parameters = parameters;
        const body = buildRequestBody(ep);
        if (body)
            operation.requestBody = body;
        paths[oaPath][ep.method.toLowerCase()] = operation;
    }
    const spec = {
        openapi: '3.0.3',
        info: {
            title: `${api.namespace.name} API`,
            description: api.namespace.description ?? `REST API for ${api.namespace.name}`,
            version: '1.0.0',
        },
        servers: [
            { url: '/', description: 'This server' },
        ],
        paths,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    };
    return JSON.stringify(spec, null, 2);
}
//# sourceMappingURL=openapi.js.map