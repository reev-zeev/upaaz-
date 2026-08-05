/**
 * وُصلة — Request Ride Use Case
 * إنشاء طلب مشوار أو توصيل
 */

import { success, failure, type Result } from "../../packages/shared/result/index.js";

export interface RequestRideInput {
  riderId: string;
  serviceType: "ride" | "delivery";
  pickup: { lat: number; lng: number; label?: string };
  dropoff?: { lat: number; lng: number; label?: string };
  cityId: string;
  paymentMethod?: string;
  notes?: string;
  parcelNote?: string;
  dropoffContact?: string;
}

export interface RequestRideOutput {
  rideId: string;
  status: string;
  estimatedFare?: number;
  createdAt: Date;
}

export interface RideRepository {
  create(input: RequestRideInput): Promise<{ id: string; status: string; createdAt: Date }>;
}

export interface PricingService {
  estimateFare(params: {
    cityId: string;
    pickupLat: number;
    pickupLng: number;
    distanceKm: number;
    serviceType: string;
  }): Promise<{ suggestedFare: number; surgeMultiplier: number }>;
}

export interface GeoService {
  calculateDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{ km: number; minutes: number }>;
}

export async function requestRide(
  input: RequestRideInput,
  deps: { rideRepo: RideRepository; pricing?: PricingService; geo?: GeoService }
): Promise<Result<RequestRideOutput>> {
  // Validate input
  if (!input.pickup.lat || !input.pickup.lng) {
    return failure("invalid_location", "يرجى تحديد موقع الانطلاق");
  }
  if (!input.cityId) {
    return failure("invalid_city", "يرجى تحديد المدينة");
  }

  // Create the ride
  const ride = await deps.rideRepo.create(input);

  return success({
    rideId: ride.id,
    status: ride.status,
    createdAt: ride.createdAt,
  });
}