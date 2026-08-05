/**
 * وُصلة — Dispatch Use Case
 * تشغيل محرك التوزيع للعثور على سائق مناسب
 */

import { success, failure, type Result } from "../../packages/shared/result/index.js";

export interface DispatchInput {
  rideId: string;
  cityId: string;
  pickupLat: number;
  pickupLng: number;
  serviceType: "ride" | "delivery";
  driverGenderPref?: string;
}

export interface DispatchOutput {
  rideId: string;
  wave: number;
  candidatesFound: number;
  status: string;
}

export interface DispatchRepository {
  findNearbyDrivers(params: {
    lat: number;
    lng: number;
    radiusKm: number;
    serviceType: string;
    limit: number;
    requireSubscription: boolean;
    cityId: string;
    genderPref?: string;
  }): Promise<Array<{ driverId: string; telegramId: number; distanceKm: number }>>;
  createOffers(rideId: string, driverIds: string[], expiresAt: Date): Promise<void>;
  updateRideStatus(rideId: string, status: string, wave: number): Promise<void>;
}

export interface GeoService {
  etaMatrix(origin: { lat: number; lng: number }, destinations: Array<{ lat: number; lng: number }>): Promise<Array<{ minutes: number; km: number }>>;
}

const SEARCH_RADIUS_KM = 25;
const FIRST_WAVE_LIMIT = 5;
const TOP_TO_NOTIFY = 3;

export async function dispatchRide(
  input: DispatchInput,
  deps: { repo: DispatchRepository; geo?: GeoService }
): Promise<Result<DispatchOutput>> {
  // Wave 1: Find subscribed drivers
  const candidates = await deps.repo.findNearbyDrivers({
    lat: input.pickupLat,
    lng: input.pickupLng,
    radiusKm: SEARCH_RADIUS_KM,
    serviceType: input.serviceType,
    limit: FIRST_WAVE_LIMIT,
    requireSubscription: true,
    cityId: input.cityId,
    genderPref: input.driverGenderPref,
  });

  if (candidates.length === 0) {
    await deps.repo.updateRideStatus(input.rideId, "failed", 1);
    return success({
      rideId: input.rideId,
      wave: 1,
      candidatesFound: 0,
      status: "failed",
    });
  }

  // Create time-limited offers
  const expiresAt = new Date(Date.now() + 30 * 1000);
  const topCandidates = candidates.slice(0, TOP_TO_NOTIFY);
  await deps.repo.createOffers(input.rideId, topCandidates.map(c => c.driverId), expiresAt);
  await deps.repo.updateRideStatus(input.rideId, "dispatching", 1);

  return success({
    rideId: input.rideId,
    wave: 1,
    candidatesFound: topCandidates.length,
    status: "dispatching",
  });
}