/**
 * وُصلة — Accept Offer Use Case
 * قبول عرض الرحلة من قبل السائق (مع منع Double-Accept)
 */

import { success, failure, type Result } from "../../packages/shared/result/index.js";

export interface AcceptOfferInput {
  rideId: string;
  driverTelegramId: number;
  driverId: string;
}

export interface AcceptOfferOutput {
  rideId: string;
  riderTelegramId: number;
  pickup: { lat: number; lng: number; label?: string };
  dropoff?: { lat: number; lng: number; label?: string };
}

export interface AcceptOfferRepository {
  claim(rideId: string, driverId: string): Promise<{ claimed: boolean; riderTelegramId?: number; pickup?: any; dropoff?: any }>;
  isDriverBusy(driverId: string): Promise<boolean>;
}

export async function acceptOffer(
  input: AcceptOfferInput,
  deps: { repo: AcceptOfferRepository }
): Promise<Result<AcceptOfferOutput>> {
  // Check if driver is busy
  const busy = await deps.repo.isDriverBusy(input.driverId);
  if (busy) {
    return failure("driver_busy", "لديك رحلة نشطة بالفعل");
  }

  // Atomic claim (single-winner, DB-level locking)
  const result = await deps.repo.claim(input.rideId, input.driverId);
  if (!result.claimed) {
    return failure("ride_taken", "تم قبول المشوار من سائق آخر");
  }

  return success({
    rideId: input.rideId,
    riderTelegramId: result.riderTelegramId!,
    pickup: result.pickup!,
    dropoff: result.dropoff,
  });
}