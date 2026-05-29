import Fastify from "fastify";
import { config } from "./config.js";
import { registerCors } from "./plugins/cors.js";
import { registerRateLimit } from "./plugins/rate-limit.js";
import { healthRoutes } from "./routes/health.js";

const isProd = config.NODE_ENV === "production";

const app = Fastify({
  logger: isProd
    ? true // pino JSON in production
    : { transport: { target: "pino-pretty", options: { colorize: true } } },
});

// Sanitize error responses in production — no stack traces or internal paths
app.setErrorHandler((error: Error & { statusCode?: number }, _req, reply) => {
  const statusCode = error.statusCode ?? 500;
  app.log.error(error);
  reply.status(statusCode).send({
    statusCode,
    error: error.name ?? "Internal Server Error",
    message: isProd && statusCode >= 500 ? "Internal Server Error" : error.message,
  });
});

app.setNotFoundHandler((_req, reply) => {
  reply.status(404).send({ statusCode: 404, error: "Not Found", message: "Not found" });
});

async function start(): Promise<void> {
  await registerCors(app);
  await registerRateLimit(app);
  await app.register(healthRoutes);

  await app.listen({ port: config.BACKEND_PORT, host: "0.0.0.0" });
}

async function shutdown(): Promise<void> {
  await app.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
