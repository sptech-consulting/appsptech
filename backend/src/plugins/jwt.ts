import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export type JwtPayload = {
  id: string;
  role: "admin" | "aluno";
};

export async function registerJwt(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: "15m", algorithm: "HS256" },
  });
}
