"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateController = generateController;
const naming_1 = require("./naming");
function classifyEndpoint(ep) {
    const hasIdParam = (ep.params ?? []).some(p => p.in === 'path' && p.name === 'id');
    if (ep.method === 'GET' && hasIdParam)
        return 'view';
    if (ep.method === 'GET')
        return 'list';
    if (!hasIdParam)
        return 'create';
    return 'update';
}
function findCoreOp(name, ops) {
    return ops.find(o => o.name === name);
}
function resolveEffectSet(set, entityVar) {
    if (typeof set === 'number')
        return String(set);
    if (typeof set === 'boolean')
        return String(set);
    if (typeof set !== 'string')
        return null;
    if (set === 'now')
        return 'Time.current';
    if (set === 'actor.id')
        return "request.env['current_user']&.dig('sub') || 'mock-user'";
    const addMatch = set.match(/^(\w+)\.(\w+)\s*\+\s*input\.(\w+)$/);
    if (addMatch) {
        const [, , entityField, inputField] = addMatch;
        return `(${entityVar}.${(0, naming_1.toSnakeCase)(entityField)} || 0) + params[:${(0, naming_1.toSnakeCase)(inputField)}].to_f`;
    }
    if (/^[\w_-]+$/.test(set))
        return `'${set}'`;
    return null;
}
function buildCreateBody(ep, resource, operation) {
    const modelName = resource.name;
    const entityFields = new Set(resource.fields.map(f => f.name));
    const permitFields = (ep.request?.fields ?? []).map(f => `:${f.name}`);
    const lines = [
        `      attrs = params.permit(${permitFields.join(', ')})`,
        `      record = ${modelName}.new(attrs)`,
        `      record.id = SecureRandom.uuid`,
    ];
    if (operation?.changes?.length) {
        for (const ch of operation.changes) {
            const attr = ch.attribute.split('.').pop();
            if (!entityFields.has(attr))
                continue;
            const val = resolveEffectSet(ch.set, 'record');
            if (val !== null)
                lines.push(`      record.${attr} = ${val}`);
        }
    }
    lines.push(`      if record.save`, `        render json: record, status: :created`, `      else`, `        render json: { errors: record.errors.full_messages }, status: :unprocessable_entity`, `      end`);
    return lines;
}
function buildViewBody(resource) {
    return [
        `      record = ${resource.name}.find(params[:id])`,
        `      render json: record`,
    ];
}
function buildListBody(ep, resource) {
    const entityFields = new Set(resource.fields.map(f => f.name));
    const filterParams = (ep.params ?? []).filter(p => p.in === 'query' && p.name !== 'page' && p.name !== 'limit' && entityFields.has(p.name));
    const lines = [`      records = ${resource.name}.all`];
    for (const p of filterParams) {
        lines.push(`      records = records.where(${p.name}: params[:${p.name}]) if params[:${p.name}].present?`);
    }
    lines.push(`      page = (params[:page] || 1).to_i`, `      limit = (params[:limit] || 20).to_i`, `      offset = (page - 1) * limit`, `      render json: { data: records.offset(offset).limit(limit), total: records.count }`);
    return lines;
}
function buildUpdateBody(ep, resource, operation) {
    const entityFields = new Set(resource.fields.map(f => f.name));
    const dtoFields = (ep.request?.fields ?? []).filter(f => entityFields.has(f.name));
    const varName = (0, naming_1.toSnakeCase)(resource.name);
    const permitFields = dtoFields.map(f => `:${f.name}`);
    const lines = [
        `      ${varName} = ${resource.name}.find(params[:id])`,
    ];
    if (permitFields.length) {
        lines.push(`      attrs = params.permit(${permitFields.join(', ')})`);
        lines.push(`      ${varName}.assign_attributes(attrs)`);
    }
    if (operation?.changes?.length) {
        for (const ch of operation.changes) {
            const attr = ch.attribute.split('.').pop();
            if (!entityFields.has(attr))
                continue;
            const val = resolveEffectSet(ch.set, varName);
            if (val !== null)
                lines.push(`      ${varName}.${attr} = ${val}`);
        }
    }
    lines.push(`      if ${varName}.save`, `        render json: ${varName}`, `      else`, `        render json: { errors: ${varName}.errors.full_messages }, status: :unprocessable_entity`, `      end`);
    return lines;
}
function generateController(resource, endpoints, _apiOperations, rules, coreOperations, _namespace) {
    const className = `${resource.name}sController`;
    const methods = [];
    for (const ep of endpoints) {
        const action = ep.operation.split('.')[1];
        const methodName = (0, naming_1.toActionMethod)(action);
        const op = findCoreOp(ep.operation, coreOperations);
        const kind = classifyEndpoint(ep);
        const accessRule = rules.find(r => r.operation === ep.operation && r.type === 'access');
        const roles = accessRule?.allow?.map(a => a.role).filter((r) => !!r) ?? [];
        const requiresOwnership = accessRule?.allow?.some(a => a.ownership) ?? false;
        let body;
        if (kind === 'create')
            body = buildCreateBody(ep, resource, op);
        else if (kind === 'view')
            body = buildViewBody(resource);
        else if (kind === 'list')
            body = buildListBody(ep, resource);
        else
            body = buildUpdateBody(ep, resource, op);
        const roleComment = roles.length ? `      # Roles: ${roles.join(', ')}` : null;
        const ownerComment = requiresOwnership ? '      # Requires ownership' : null;
        const lines = [
            `    # ${ep.operation}${ep.description ? `: ${ep.description}` : ''}`,
            `    def ${methodName}`,
        ];
        if (roleComment)
            lines.push(roleComment);
        if (ownerComment)
            lines.push(ownerComment);
        lines.push(...body);
        lines.push(`    end`);
        methods.push(lines.join('\n'));
    }
    const roleChecks = [];
    for (const ep of endpoints) {
        const action = ep.operation.split('.')[1];
        const methodName = (0, naming_1.toActionMethod)(action);
        const accessRule = rules.find(r => r.operation === ep.operation && r.type === 'access');
        const allowEntries = accessRule?.allow ?? [];
        const roles = allowEntries.map(a => a.role).filter((r) => !!r);
        const hasFlags = allowEntries.some(a => Array.isArray(a.flags) && a.flags.length > 0);
        if (hasFlags) {
            // Emit full allow[] structure — Ruby hash literal per entry.
            const rubyEntries = allowEntries.map(e => {
                const parts = [];
                if (e.role)
                    parts.push(`role: '${e.role}'`);
                if (e.ownership)
                    parts.push(`ownership: true`);
                if (e.flags && e.flags.length > 0) {
                    parts.push(`flags: [${e.flags.map((f) => `'${f}'`).join(', ')}]`);
                }
                return `{ ${parts.join(', ')} }`;
            }).join(', ');
            roleChecks.push(`    authorize_allow! [${rubyEntries}], only: [:${methodName}]`);
        }
        else if (roles.length) {
            roleChecks.push(`    authorize_roles! ${roles.map(r => `'${r}'`).join(', ')}, only: [:${methodName}]`);
        }
    }
    return `class ${className} < ApplicationController
    before_action :authenticate!
${roleChecks.length ? roleChecks.join('\n') + '\n' : ''}
${methods.join('\n\n')}
  end
`;
}
//# sourceMappingURL=controller.js.map