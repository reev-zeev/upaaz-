/**
 * وُصلة — Safety Domain
 * السلامة، الطوارئ، كشف الاحتيال
 */

import { AggregateRoot } from "../../shared/kernel/index.js";

export type EmergencySeverity = "low" | "medium" | "high" | "critical";

export type EmergencyStatus = "open" | "acknowledged" | "resolved" | "false_alarm";

export interface EmergencyData {
  id: string;
  rideId: string;
  reporterId: number;
  reporterRole: "rider" | "driver" | "support";
  severity: EmergencySeverity;
  status: EmergencyStatus;
  description: string;
  location?: { lat: number; lng: number };
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class Emergency extends AggregateRoot<string> {
  constructor(private data: EmergencyData) {
    super(data.id);
  }

  acknowledge(adminId: string): void {
    this.data.status = "acknowledged";
  }

  resolve(adminId: string, notes?: string): void {
    this.data.status = "resolved";
    this.data.resolvedAt = new Date();
    this.data.resolvedBy = adminId;
  }
}

// Fraud detection types
export type FraudIndicator = 
  | "multiple_accounts"
  | "fake_rides"
  | "payment_fraud"
  | "rating_manipulation"
  | "location_spoofing"
  | "promotion_abuse";

export interface FraudAlert {
  id: string;
  indicator: FraudIndicator;
  entityId: string;
  entityType: "rider" | "driver" | "merchant";
  confidenceScore: number; // 0-1
  evidence: Record<string, unknown>;
  status: "pending" | "investigating" | "confirmed" | "dismissed";
  createdAt: Date;
}