/**
 * وُصلة — Subscription Domain
 * نظام الاشتراكات والتسعير
 */

import { AggregateRoot, ValueObject } from "../../shared/kernel/index.js";

export type SubscriptionPlan = "trial" | "rides" | "delivery" | "combined" | "merchant_basic" | "merchant_premium" | "enterprise";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";

export interface SubscriptionData {
  id: string;
  subscriberId: string;
  subscriberType: "driver" | "merchant" | "enterprise";
  plan: SubscriptionPlan;
  priceSar: number;
  status: SubscriptionStatus;
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  startsAt: Date;
  endsAt: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription pricing (configurable from admin panel)
export const SUBSCRIPTION_PRICES: Record<SubscriptionPlan, number> = {
  trial: 0,
  rides: 250,
  delivery: 250,
  combined: 400,
  merchant_basic: 249,
  merchant_premium: 399,
  enterprise: 999,
};

export class Subscription extends AggregateRoot<string> {
  constructor(private data: SubscriptionData) {
    super(data.id);
  }

  get snapshot(): SubscriptionData {
    return { ...this.data };
  }

  get isActive(): boolean {
    return this.data.status === "active" && new Date() < this.data.endsAt;
  }

  get isTrial(): boolean {
    return this.data.plan === "trial";
  }

  get plan(): SubscriptionPlan {
    return this.data.plan;
  }

  coversService(serviceType: "ride" | "delivery"): boolean {
    if (!this.isActive) return false;
    if (this.data.plan === "combined") return true;
    if (this.data.plan === "rides" && serviceType === "ride") return true;
    if (this.data.plan === "delivery" && serviceType === "delivery") return true;
    return this.isTrial; // trial covers one active service
  }

  renew(months: number = 1): void {
    const newEnd = new Date(this.data.endsAt);
    newEnd.setMonth(newEnd.getMonth() + months);
    this.data.endsAt = newEnd;
    this.data.status = "active";
    this.data.updatedAt = new Date();
  }

  cancel(): void {
    this.data.status = "cancelled";
    this.data.updatedAt = new Date();
  }

  expire(): void {
    this.data.status = "expired";
    this.data.updatedAt = new Date();
  }
}