"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function addToCart(productId: string, quantity: number, variantId?: string) {
  const supabase = createClient(cookies());
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Anda harus login untuk menambahkan ke keranjang." };
  }

  // Cari cart aktif untuk user ini (lewat relasi accounts -> buyers -> carts)
  // Tapi struktur yang di ERD carts punya buyer_id foreign key ke buyers.
  // Untuk amannya, asumsikan auth.uid() == buyers.id (karena id buyers references accounts.id references auth.users.id)
  let { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("buyer_id", user.id)
    .maybeSingle();

  // Jika tidak ada cart, buat baru
  if (!cart) {
    const { data: newCart, error: cartError } = await supabase
      .from("carts")
      .insert({ buyer_id: user.id })
      .select("id")
      .single();
    
    if (cartError) {
      console.error(cartError);
      return { error: "Gagal membuat keranjang. Pastikan profil pembeli sudah lengkap." };
    }
    cart = newCart;
  }

  // Cek apakah item sudah ada di keranjang
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .eq("selected_variant_id", variantId || null)
    .maybeSingle();

  if (existingItem) {
    // Update quantity
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id);
      
    if (error) return { error: "Gagal update keranjang." };
  } else {
    // Insert item baru
    const { error } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cart.id,
        product_id: productId,
        quantity: quantity,
        selected_variant_id: variantId || null,
      });
      
    if (error) return { error: "Gagal menambah item ke keranjang." };
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function updateCartItemQty(itemId: string, newQty: number) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  if (newQty < 1) {
    return removeCartItem(itemId);
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: newQty })
    .eq("id", itemId);

  if (error) return { error: "Gagal update kuantitas" };

  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { success: true };
}

export async function removeCartItem(itemId: string) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId);

  if (error) return { error: "Gagal menghapus item" };

  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { success: true };
}

export async function clearCart() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (!cart) return { success: true };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id);

  if (error) return { error: "Gagal mengosongkan keranjang" };

  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { success: true };
}
