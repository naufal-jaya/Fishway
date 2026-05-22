"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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
  is_primary: boolean;
}) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  if (formData.is_primary) {
    await supabase.from("addresses").update({ is_primary: false }).eq("user_id", user.id);
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
  is_primary: boolean;
}) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  if (formData.is_primary) {
    await supabase.from("addresses").update({ is_primary: false }).eq("user_id", user.id);
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

  await supabase.from("addresses").update({ is_primary: false }).eq("user_id", user.id);
  await supabase.from("addresses").update({ is_primary: true }).eq("id", id).eq("user_id", user.id);

  revalidatePath("/profile");
  return { success: true };
}