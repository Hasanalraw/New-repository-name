/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";
import { PlatformAnswers } from "../types";

export function sanitizeSupabaseUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned) return "";
  
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, "");

  // If user pasted a dashboard project URL like:
  // https://supabase.com/dashboard/project/vtwufalyematvkubylcl/editor/17660
  // or https://supabase.com/dashboard/project/vtwufalyematvkubylcl
  const dashboardRegex = /supabase\.com\/dashboard\/project\/([a-zA-Z0-9]+)/i;
  const match = cleaned.match(dashboardRegex);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }
  
  // If user pasted just the 20-character project reference e.g., vtwufalyematvkubylcl
  if (/^[a-zA-Z0-9]{20}$/.test(cleaned)) {
    return `https://${cleaned}.supabase.co`;
  }
  
  // Ensure it starts with https:// (or http:// for local testing)
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = "https://" + cleaned;
  }
  
  return cleaned;
}

// Check if actual Supabase environment variables or custom localStorage credentials are provided
const rawCustomUrl = localStorage.getItem("custom_supabase_url") || "";
const supabaseUrl = rawCustomUrl 
  ? sanitizeSupabaseUrl(rawCustomUrl) 
  : (import.meta as any).env.VITE_SUPABASE_URL || "https://vtwufalyematvkubylcl.supabase.co";

const supabaseAnonKey = localStorage.getItem("custom_supabase_key") || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d3VmYWx5ZW1hdHZrdWJ5bGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjAxMDUsImV4cCI6MjA5Nzg5NjEwNX0.2J5-UpQQY9OwBcMPmmNv1AdLgb3GzhjlrDcBqnyu-1o";

// Robust Mock Database structure in LocalStorage
class MockSupabaseClient {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Auth Operations
  auth = {
    signUp: async ({ email, password }: { email: string; password?: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const users = this.getStorageItem<any[]>("mock_supabase_users", []);
      const normalizedEmail = email.trim().toLowerCase();
      
      if (users.some((u) => u.email.trim().toLowerCase() === normalizedEmail)) {
        return { data: { user: null }, error: { message: "هذا البريد الإلكتروني مسجل بالفعل! يرجى التبديل إلى تبويب 'تسجيل الدخول' وكتابة كلمة المرور للدخول بنجاح." } };
      }

      const newUser = {
        id: "usr_" + Math.random().toString(36).substring(2, 11),
        email: normalizedEmail,
        password, // Simulating simple secure store
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      this.setStorageItem("mock_supabase_users", users);
      this.setStorageItem("mock_supabase_session_user", newUser);

      // Trigger auth state change callbacks
      this.triggerAuthStateChange("SIGNED_IN", { user: newUser });

      return { data: { user: newUser }, error: null };
    },

    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const users = this.getStorageItem<any[]>("mock_supabase_users", []);
      const normalizedEmail = email.trim().toLowerCase();
      
      const emailExists = users.some((u) => u.email.trim().toLowerCase() === normalizedEmail);
      if (!emailExists) {
        return { data: { user: null }, error: { message: "هذا البريد الإلكتروني غير مسجل بعد! يرجى الضغط على 'إنشاء حساب سحابي' لتفعيل حسابك أولاً." } };
      }
      
      const user = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail && u.password === password);

      if (!user) {
        return { data: { user: null }, error: { message: "كلمة المرور الشخصية غير صحيحة! يرجى التحقق من كلمة المرور أو استخدام رابط الاستعادة." } };
      }

      this.setStorageItem("mock_supabase_session_user", user);
      this.triggerAuthStateChange("SIGNED_IN", { user });

      return { data: { user }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem("mock_supabase_session_user");
      this.triggerAuthStateChange("SIGNED_OUT", null);
      return { error: null };
    },

    getUser: async () => {
      const user = this.getStorageItem<any | null>("mock_supabase_session_user", null);
      return { data: { user }, error: null };
    },

    resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const users = this.getStorageItem<any[]>("mock_supabase_users", []);
      const userExists = users.some((u) => u.email === email);
      if (!userExists) {
        return { data: null, error: { message: "هذا البريد غير مسجل في المنصة!" } };
      }
      return { data: {}, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      const sessionUser = this.getStorageItem<any | null>("mock_supabase_session_user", null);
      if (sessionUser) {
        callback("SIGNED_IN", { user: sessionUser });
      } else {
        callback("SIGNED_OUT", null);
      }
      this.listeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners = this.listeners.filter((l) => l !== callback);
            },
          },
        },
      };
    },

    updateUser: async ({ password }: { password: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const sessionUser = this.getStorageItem<any | null>("mock_supabase_session_user", null);
      if (!sessionUser) {
        return { data: null, error: { message: "غير مصرح به" } };
      }
      
      const users = this.getStorageItem<any[]>("mock_supabase_users", []);
      const idx = users.findIndex((u) => u.id === sessionUser.id);
      if (idx !== -1) {
        users[idx].password = password;
        this.setStorageItem("mock_supabase_users", users);
      }
      sessionUser.password = password;
      this.setStorageItem("mock_supabase_session_user", sessionUser);
      return { data: { user: sessionUser }, error: null };
    },
  };

  private listeners: Function[] = [];

  private triggerAuthStateChange(event: string, session: any) {
    this.listeners.forEach((l) => l(event, session));
  }

  // Database Operations
  from(table: string) {
    return {
      select: (columns = "*") => {
        return {
          eq: (field: string, value: any) => {
            return {
              single: async () => {
                await new Promise((resolve) => setTimeout(resolve, 300));
                if (table === "user_data") {
                  const allData = this.getStorageItem<any[]>("mock_supabase_userdata", []);
                  const record = allData.find((d) => d[field] === value);
                  if (record) {
                    return { data: record, error: null };
                  }
                  return { data: null, error: { message: "No row found" } };
                }
                return { data: null, error: { message: "Table not found" } };
              },
              async then(resolve: Function) {
                await new Promise((r) => setTimeout(r, 200));
                // Return array
                return resolve({ data: [], error: null });
              }
            };
          }
        };
      },
      upsert: async (record: any) => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (table === "user_data") {
          const allData = this.getStorageItem<any[]>("mock_supabase_userdata", []);
          const index = allData.findIndex((d) => d.user_id === record.user_id);
          
          const updatedRecord = {
            ...record,
            updated_at: new Date().toISOString(),
          };

          if (index !== -1) {
            allData[index] = updatedRecord;
          } else {
            allData.push(updatedRecord);
          }
          
          this.setStorageItem("mock_supabase_userdata", allData);
          return { data: updatedRecord, error: null };
        }
        return { data: null, error: { message: "Table not found" } };
      }
    };
  }
}

// Instantiate the appropriate client
export const isRealSupabase = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isRealSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new MockSupabaseClient() as any);

/**
 * Quick helper to update custom credentials dynamically if desired
 */
export function setCustomSupabaseCredentials(url: string, key: string) {
  if (url && key) {
    const sanitizedUrl = sanitizeSupabaseUrl(url);
    localStorage.setItem("custom_supabase_url", sanitizedUrl);
    localStorage.setItem("custom_supabase_key", key);
    window.location.reload();
  }
}

export function clearCustomSupabaseCredentials() {
  localStorage.removeItem("custom_supabase_url");
  localStorage.removeItem("custom_supabase_key");
  window.location.reload();
}
