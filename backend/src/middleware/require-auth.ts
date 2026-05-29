import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtPayload } from "../plugins/jwt.js";

// Extend @fastify/jwt's namespace so req.user is typed as JwtPayload
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();
  } catch {
    reply
      .status(401)
      .send({ statusCode: 401, error: "Unauthorized", message: "Token inválido ou ausente." });
  }
}
