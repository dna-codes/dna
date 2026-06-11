"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELIVERY_ADAPTERS = void 0;
exports.isDeliveryAdapterId = isDeliveryAdapterId;
exports.launchWith = launchWith;
exports.teardownWith = teardownWith;
exports.statusWith = statusWith;
const docker_compose_1 = require("./adapters/docker-compose");
const terraform_aws_1 = require("./adapters/terraform-aws");
/**
 * Shared registry of launch/teardown hooks per delivery adapter. Consumed by
 * `cba up` and `cba down`. The generate() side still lives in deliver/index.ts
 * (it's tightly coupled to the plan/json/human output machinery there); this
 * registry is intentionally narrow — just the process-orchestration hooks.
 */
exports.DELIVERY_ADAPTERS = ['docker-compose', 'terraform/aws'];
function isDeliveryAdapterId(id) {
    return exports.DELIVERY_ADAPTERS.includes(id);
}
function launchWith(id, ctx) {
    switch (id) {
        case 'docker-compose':
            return (0, docker_compose_1.launchCompose)(ctx);
        case 'terraform/aws':
            return (0, terraform_aws_1.launchTerraform)(ctx);
    }
}
function teardownWith(id, ctx) {
    switch (id) {
        case 'docker-compose':
            return (0, docker_compose_1.teardownCompose)(ctx);
        case 'terraform/aws':
            return (0, terraform_aws_1.teardownTerraform)(ctx);
    }
}
function statusWith(id, ctx) {
    switch (id) {
        case 'docker-compose':
            return (0, docker_compose_1.statusCompose)(ctx);
        case 'terraform/aws':
            return (0, terraform_aws_1.statusTerraform)(ctx);
    }
}
//# sourceMappingURL=registry.js.map