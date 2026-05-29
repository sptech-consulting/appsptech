import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, () => {
    return { status: "ok" };
  });
}
