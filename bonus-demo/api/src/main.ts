import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.enableCors({ origin: true });

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addContentTypeParser(
    "text/csv",
    { parseAs: "string" },
    (_request, body, done) => {
      done(null, body);
    },
  );
  fastify.addContentTypeParser(
    "text/plain",
    { parseAs: "string" },
    (_request, body, done) => {
      done(null, body);
    },
  );

  await app.listen(3001, "0.0.0.0");
  console.log("Bonus demo API listening on http://localhost:3001");
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
