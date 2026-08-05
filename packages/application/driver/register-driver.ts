/**
 * وُصلة — Register Driver Use Case
 * تسجيل سائق جديد مع KYC
 */

import { success, failure, type Result } from "../../packages/shared/result/index.js";

export interface RegisterDriverInput {
  telegramId: number;
  fullName: string;
  phone: string;
  city: string;
  workArea?: string;
  carModel: string;
  carPlate: string;
  carColor?: string;
}

export interface RegisterDriverOutput {
  driverId: string;
  kycStatus: string;
}

export interface DriverRegistrationRepository {
  findUserByTelegramId(tgId: number): Promise<{ id: string } | null>;
  createUser(data: { telegramId: number; fullName: string; phone: string }): Promise<{ id: string }>;
  createDriver(data: {
    userId: string;
    city: string;
    workArea?: string;
    carModel: string;
    carPlate: string;
    carColor?: string;
  }): Promise<{ id: string }>;
  createFreeTrial(driverId: string): Promise<void>;
}

export async function registerDriver(
  input: RegisterDriverInput,
  deps: { repo: DriverRegistrationRepository }
): Promise<Result<RegisterDriverOutput>> {
  // Validate required fields
  if (!input.fullName?.trim()) return failure("missing_name", "يرجى إدخال الاسم الكامل");
  if (!input.phone?.trim()) return failure("missing_phone", "يرجى إدخال رقم الجوال");
  if (!input.city?.trim()) return failure("missing_city", "يرجى إدخال المدينة");
  if (!input.carModel?.trim()) return failure("missing_car", "يرجى إدخال موديل السيارة");

  // Check if user exists
  let user = await deps.repo.findUserByTelegramId(input.telegramId);
  if (!user) {
    user = await deps.repo.createUser({
      telegramId: input.telegramId,
      fullName: input.fullName,
      phone: input.phone,
    });
  }

  // Create driver profile
  const driver = await deps.repo.createDriver({
    userId: user.id,
    city: input.city,
    workArea: input.workArea,
    carModel: input.carModel,
    carPlate: input.carPlate,
    carColor: input.carColor,
  });

  // Start free trial
  await deps.repo.createFreeTrial(driver.id);

  return success({
    driverId: driver.id,
    kycStatus: "pending",
  });
}