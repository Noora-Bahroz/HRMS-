import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "../config";

export interface AccessTokenPayload {
  sub: string; // userId
  tenantId: string;
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // token id
  type: "refresh";
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
  if (decoded.type !== "access") throw new Error("Wrong token type");
  return decoded;
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign({ sub: userId, jti, type: "refresh" }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
  if (decoded.type !== "refresh") throw new Error("Wrong token type");
  return decoded;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomTokenId(): string {
  return crypto.randomBytes(16).toString("hex");
}
