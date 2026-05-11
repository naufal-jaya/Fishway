"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function markNotificationAsRead(id: string) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return { error: "Gagal menandai notifikasi" };
  }

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error(error);
    return { error: "Gagal menandai semua notifikasi" };
  }

  return { success: true };
}
