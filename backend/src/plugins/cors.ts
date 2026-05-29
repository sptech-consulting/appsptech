import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}
