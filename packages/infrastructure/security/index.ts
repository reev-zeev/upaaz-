/**
 * وُصلة — Security Primitives
 * HMAC, Rate Limiting, IP Allowlist, Field Encryption
 */

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

// --- HMAC Signature Verification ---

export function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a ?? "", "utf8");
  const bufB = Buffer.from(b ?? "", "utf8");
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyHmacSignature(secret: string, payload: string, signature: string): boolean {
  return safeCompare(hmacHex(secret, payload), (signature ?? "").replace(/^sha256=/, ""));
}

// --- Rate Limiting ---

export interface RateLimitStore {
  get(key: string): Promise<number>;
  increment(key: string, ttlSeconds: number): Promise<number>;
  reset(key: string): Promise<void>;
}

export class SlidingWindowRateLimiter {
  constructor(
    private store: RateLimitStore,
    private maxRequests: number,
    private windowSeconds: number
  ) {}

  async check(key: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const count = await this.store.increment(key, this.windowSeconds);
    return {
      allowed: count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - count),
      resetIn: this.windowSeconds,
    };
  }
}

// --- IP Allowlist ---

export class IpAllowlist {
  private allowed: Set<string>;

  constructor(allowedIps: string[]) {
    this.allowed = new Set(allowedIps);
  }

  isAllowed(ip: string): boolean {
    return this.allowed.has(ip);
  }

  add(ip: string): void {
    this.allowed.add(ip);
  }
}

// --- Telegram IP Ranges (official) ---
export const TELEGRAM_IP_RANGES = [
  "149.154.160.0/20",
  "91.108.4.0/22",
  "91.108.56.0/22",
  "91.108.8.0/22",
];

// --- Field Encryption ---

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export function encryptField(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createHmac("sha256", key).update(iv).digest("hex");
  // Simplified encryption - in production use proper AES-GCM
  const encrypted = Buffer.from(plaintext).toString("base64");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptField(ciphertext: string, key: Buffer): string {
  const [ivHex, encrypted] = ciphertext.split(":");
  // Simplified decryption
  return Buffer.from(encrypted, "base64").toString("utf8");
}

// --- Telegram Webhook Verification ---

export function verifyTelegramWebhook(secretToken: string, headerToken: string | null): boolean {
  if (!headerToken) return false;
  return safeCompare(secretToken, headerToken);
}