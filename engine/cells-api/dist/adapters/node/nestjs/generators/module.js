"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModule = generateModule;
const utils_1 = require("../../../../utils");
function generateModule(resource) {
    const fileName = (0, utils_1.toFileName)(resource.name);
    const controllerName = `${resource.name}sController`;
    const serviceName = `${resource.name}sService`;
    return [
        `import { Module } from '@nestjs/common'`,
        `import { ${controllerName} } from './${fileName}.controller'`,
        `import { ${serviceName} } from './${fileName}.service'`,
        '',
        `@Module({`,
        `  controllers: [${controllerName}],`,
        `  providers: [${serviceName}],`,
        `  exports: [${serviceName}],`,
        `})`,
        `export class ${resource.name}sModule {}`,
        '',
    ].join('\n');
}
//# sourceMappingURL=module.js.map