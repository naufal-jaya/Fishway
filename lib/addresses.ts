"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const getAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    return createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
  }
  return null;
};

export async function getAddresses() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  return data || [];
}

export async function addAddress(formData: {
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  lat?: number;
  lon?: number;
  is_primary: boolean;
}) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const adminClient = getAdminClient();
  const db = adminClient || supabase;

  if (formData.is_primary) {
    await db.from("addresses").update({ is_primary: false }).eq("user_id", user.id);
  }

  const { error } = await supabase.from("addresses").insert({
    ...formData,
    user_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function updateAddress(id: string, formData: {
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  lat?: number;
  lon?: number;
  is_primary: boolean;
}) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const adminClient = getAdminClient();
  const db = adminClient || supabase;

  if (formData.is_primary) {
    await db.from("addresses").update({ is_primary: false }).eq("user_id", user.id);
  }

  const { error } = await supabase.from("addresses").update(formData).eq("id", id).eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAddress(id: string) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function setPrimaryAddress(id: string) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const adminClient = getAdminClient();
  const db = adminClient || supabase;

  await db.from("addresses").update({ is_primary: false }).eq("user_id", user.id);
  await db.from("addresses").update({ is_primary: true }).eq("id", id).eq("user_id", user.id);

  revalidatePath("/profile");
  return { success: true };
}