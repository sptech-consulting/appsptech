import apiReference from "@scalar/fastify-api-reference";
import fastifySwagger from "@fastify/swagger";
import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  // Only expose docs in development — never in production
  if (config.NODE_ENV !== "development") return;

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "CMS SPTech API",
        description: "Backend da plataforma de pós-graduação SPTech",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(apiReference, {
    routePrefix: "/docs",
    configuration: {
      theme: "default",
      darkMode: true,
      layout: "modern",
    },
  });
}
