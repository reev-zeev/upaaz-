/**
 * وُصلة — API Server Entry Point
 * خادم API الرئيسي للمنصة
 */

import { initializeSupabase } from "@waslah/infrastructure/supabase/client";

// Initialize infrastructure
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

initializeSupabase(supabaseUrl, supabaseServiceKey, supabaseAnonKey || "");

console.log("🚀 وُصلة API Server ready");
console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`🕐 Timezone: ${process.env.TIMEZONE || "Asia/Riyadh"}`);

// Export health check
export default {
  port: process.env.PORT || 3000,
  name: "waslah-api",
};