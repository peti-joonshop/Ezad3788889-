import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ENV } from "./env";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function key() {
  if (!ENV.cookieSecret) throw new Error("MANUS_JWT_SECRET is required to encrypt integration credentials");
  return createHash("sha256").update(ENV.cookieSecret, "utf8").digest();
}

export function encryptSecret(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret<T>(payload: string): T {
  const [version, ivValue, tagValue, encryptedValue] = payload.split(".");
  if (version !== VERSION || !ivValue || !tagValue || !encryptedValue) throw new Error("Invalid encrypted integration credentials");
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}
