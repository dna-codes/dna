"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAppModule = generateAppModule;
exports.generateMain = generateMain;
function generateAppModule(resources) {
    const moduleImports = resources.map(r => `import { ${r.name}sModule } from './${r.name.toLowerCase()}s/${r.name.toLowerCase()}s.module'`);
    const moduleRefs = resources.map(r => `    ${r.name}sModule`);
    return [
        `import { Module } from '@nestjs/common'`,
        `import { ConfigModule } from '@nestjs/config'`,
        ...moduleImports,
        '',
        `@Module({`,
        `  imports: [`,
        `    ConfigModule.forRoot({ isGlobal: true }),`,
        ...moduleRefs.map(r => `${r},`),
        `  ],`,
        `})`,
        `export class AppModule {}`,
        '',
    ].join('\n');
}
function generateMain(namespace, port = 3000) {
    const title = `${namespace.name} API`;
    const description = namespace.description ?? `REST API for ${namespace.name}`;
    return `import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('${title}')
    .setDescription('${description}')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  app.getHttpAdapter().get('/docs', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html')
    res.send(\`<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>body { margin: 0; padding: 0; }</style>
  </head>
  <body>
    <redoc spec-url="/api-json" expand-responses="all"></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc/bundles/redoc.standalone.js"></script>
  </body>
</html>\`)
  })

  const listenPort = process.env.PORT ?? ${port}
  await app.listen(listenPort)
  console.log(\`Listening:  http://localhost:\${listenPort}\`)
  console.log(\`API docs:   http://localhost:\${listenPort}/docs\`)
}
bootstrap()
`;
}
//# sourceMappingURL=app.js.map