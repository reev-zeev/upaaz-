/**
 * وُصلة — Ride Domain
 * كيان الرحلات (مشاوير + توصيل)
 */

import { AggregateRoot, ValueObject } from "../../shared/kernel/index.js";

// --- Value Objects ---

export class Location extends ValueObject<{
  lat: number;
  lng: number;
  label?: string;
}> {}

export class Money extends ValueObject<{
  amount: number;
  currency: string;
}> {}

export class Distance extends ValueObject<{
  km: number;
  meters?: number;
}> {}

export class Duration extends ValueObject<{
  minutes: number;
}> {}

// --- Types ---

export type ServiceType = "ride" | "delivery" | "courier" | "shuttle" | "corporate" | "government";

export type RideStatus =
  | "requested"
  | "dispatching"
  | "matched"
  | "arrived"
  | "started"
  | "finished"
  | "cancelled"
  | "expired"
  | "failed";

export type PaymentMethod = "cash" | "card" | "wallet" | "stcpay" | "mada";

// --- FSM (Finite State Machine) ---

export const RIDE_TRANSITIONS: Record<RideStatus, readonly RideStatus[]> = {
  requested: ["dispatching", "cancelled", "expired"],
  dispatching: ["matched", "cancelled", "expired", "failed"],
  matched: ["arrived", "cancelled"],
  arrived: ["started", "cancelled"],
  started: ["finished"],
  finished: [],
  cancelled: [],
  expired: [],
  failed: [],
};

export const TERMINAL_STATUSES: readonly RideStatus[] = ["finished", "cancelled", "expired", "failed"];

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return RIDE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminal(status: RideStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isActive(status: RideStatus): boolean {
  return ["matched", "arrived", "started"].includes(status);
}

// --- Ride Entity ---

export interface RideData {
  id: string;
  riderId: string;
  driverId?: string;
  serviceType: ServiceType;
  status: RideStatus;
  pickup: { lat: number; lng: number; label?: string };
  dropoff?: { lat: number; lng: number; label?: string };
  distance?: number;
  duration?: number;
  suggestedFare?: number;
  surgeMultiplier?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  cityId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Ride extends AggregateRoot<string> {
  constructor(private data: RideData) {
    super(data.id);
  }

  get snapshot(): RideData {
    return { ...this.data };
  }

  get status(): RideStatus {
    return this.data.status;
  }

  get driverId(): string | undefined {
    return this.data.driverId;
  }

  get riderId(): string {
    return this.data.riderId;
  }

  transition(to: RideStatus): string | null {
    if (isTerminal(this.data.status)) {
      return `الرحلة في حالة نهائية (${this.data.status})`;
    }
    if (!canTransition(this.data.status, to)) {
      return `انتقال غير مسموح: ${this.data.status} → ${to}`;
    }
    this.data.status = to;
    this.data.version += 1;
    this.data.updatedAt = new Date();
    return null; // success
  }

  assignDriver(driverId: string): string | null {
    if (this.data.status !== "dispatching" && this.data.status !== "requested") {
      return "لا يمكن تعيين سائق في هذه الحالة";
    }
    if (this.data.driverId) {
      return "الرحلة معينة لسائق بالفعل";
    }
    this.data.driverId = driverId;
    this.data.status = "matched";
    this.data.version += 1;
    this.data.updatedAt = new Date();
    return null;
  }
}