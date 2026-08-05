/**
 * وُصلة — Identity Domain
 * الهوية، التسجيل، التوثيق، OTP
 */

import { AggregateRoot, ValueObject } from "../../shared/kernel/index.js";

export type UserRole = "rider" | "driver" | "merchant" | "enterprise" | "admin" | "support" | "dispatcher" | "supervisor";

export type KycStatus = "pending" | "submitted" | "verified" | "rejected" | "suspended";

export interface UserData {
  id: string;
  telegramId: number;
  phone?: string;
  fullName?: string;
  username?: string;
  role: UserRole;
  kycStatus: KycStatus;
  isActive: boolean;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<string> {
  constructor(private data: UserData) {
    super(data.id);
  }

  get snapshot(): UserData {
    return { ...this.data };
  }

  get telegramId(): number {
    return this.data.telegramId;
  }

  get role(): UserRole {
    return this.data.role;
  }

  get kycStatus(): KycStatus {
    return this.data.kycStatus;
  }

  updateProfile(updates: Partial<Pick<UserData, "fullName" | "phone" | "language">>): void {
    Object.assign(this.data, updates);
    this.data.updatedAt = new Date();
  }

  setKycStatus(status: KycStatus): void {
    this.data.kycStatus = status;
    this.data.updatedAt = new Date();
  }

  suspend(): void {
    this.data.isActive = false;
    this.data.updatedAt = new Date();
  }

  activate(): void {
    this.data.isActive = true;
    this.data.updatedAt = new Date();
  }
}

// --- Driver-specific data ---

export interface DriverData {
  id: string;
  userId: string;
  city: string;
  workArea?: string;
  preferredAreas?: string[];
  carModel?: string;
  carPlate?: string;
  carColor?: string;
  carType?: string;
  privacyMode: "open" | "hidden";
  isAvailable: boolean;
  activeServiceMode: "ride" | "delivery" | "both";
  ratingAvg: number;
  ratingCount: number;
  totalTrips: number;
  lastLat?: number;
  lastLon?: number;
}

export class Driver extends AggregateRoot<string> {
  constructor(private data: DriverData) {
    super(data.id);
  }

  get snapshot(): DriverData {
    return { ...this.data };
  }

  get userId(): string {
    return this.data.userId;
  }

  setAvailability(available: boolean): void {
    this.data.isAvailable = available;
  }

  setServiceMode(mode: "ride" | "delivery" | "both"): void {
    this.data.activeServiceMode = mode;
  }

  updateLocation(lat: number, lng: number): void {
    this.data.lastLat = lat;
    this.data.lastLon = lng;
  }

  updateRating(newRating: number): void {
    this.data.ratingAvg = 
      (this.data.ratingAvg * this.data.ratingCount + newRating) / (this.data.ratingCount + 1);
    this.data.ratingCount += 1;
  }
}