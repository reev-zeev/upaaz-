/**
 * وُصلة — Supabase Client
 * تكامل مع Supabase (PostgreSQL + Auth + Realtime)
 */

import { createClient } from "@supabase/supabase-js";

let supabaseUrl = "";
let supabaseServiceKey = "";
let supabaseAnonKey = "";

export function initializeSupabase(url: string, serviceKey: string, anonKey: string): void {
  supabaseUrl = url;
  supabaseServiceKey = serviceKey;
  supabaseAnonKey = anonKey;
}

export function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase not initialized. Call initializeSupabase() first.");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export function getAnonClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase not initialized. Call initializeSupabase() first.");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export type SupabaseClient = ReturnType<typeof getAdminClient>;