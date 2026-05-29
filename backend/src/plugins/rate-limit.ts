import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

// Global default: 100 requests per minute per IP.
// Auth routes apply a stricter limit defined inline in their handlers.
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Rate limit exceeded. Try again later.",
    }),
  });
}
