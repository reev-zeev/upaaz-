/**
 * وُصلة — Dispatch Domain
 * محرك التوزيع والمطابقة الذكية
 */

import { AggregateRoot } from "../../shared/kernel/index.js";

export type DispatchWave = 1 | 2 | 3;

export type DispatchStrategy = "greedy" | "batched" | "ai";

export interface DispatchConfig {
  strategy: DispatchStrategy;
  firstWaveLimit: number;
  firstWaveTimeoutSec: number;
  searchRadiusKm: number;
  wave2DelaySec: number;
  maxWaves: number;
}

export const DEFAULT_DISPATCH_CONFIG: DispatchConfig = {
  strategy: "batched",
  firstWaveLimit: 5,
  firstWaveTimeoutSec: 30,
  searchRadiusKm: 25,
  wave2DelaySec: 60,
  maxWaves: 3,
};

export interface DispatchCandidate {
  driverId: string;
  telegramId: number;
  distanceKm: number;
  etaMinutes: number;
  ratingAvg: number;
  acceptanceRate: number;
  score: number;
}

export interface DispatchResult {
  rideId: string;
  wave: DispatchWave;
  candidates: DispatchCandidate[];
  selectedDriverId?: string;
  status: "searching" | "matched" | "failed";
  timestamp: Date;
}

export function calculateDriverScore(
  driver: {
    distanceKm: number;
    ratingAvg: number;
    acceptanceRate: number;
    isSubscribed: boolean;
    preferredAreas: string[];
    pickupArea: string;
  }
): number {
  let score = 0;

  // Distance score (closer = better)
  if (driver.distanceKm <= 3) score += 200;
  else if (driver.distanceKm <= 7) score += 100;
  else if (driver.distanceKm <= 15) score += 30;
  score -= Math.min(driver.distanceKm, 25);

  // Rating score
  score += driver.ratingAvg * 10;

  // Acceptance rate bonus
  if (driver.acceptanceRate > 0.8) score += 50;
  else if (driver.acceptanceRate > 0.6) score += 20;

  // Preferred area bonus
  const area = driver.pickupArea.toLowerCase();
  if (driver.preferredAreas.some(p => area.includes(p) || p.includes(area))) {
    score += 80;
  }

  // Subscription bonus (secondary factor, per directive §9.1)
  if (driver.isSubscribed) score += 30;

  return score;
}