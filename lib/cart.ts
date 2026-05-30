"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { formatPrice } from "@/lib/data";

export async function addToCart(productId: string, quantity: number, variantId?: string) {
  const supabase = createClient(cookies());
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Anda harus login untuk menambahkan ke keranjang." };
  }

  let { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("buyer_id", user.id)
    .maybeSingle();

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

  let existingQuery = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId);

  existingQuery = variantId
    ? existingQuery.eq("selected_variant_id", variantId)
    : existingQuery.is("selected_variant_id", null);

  const { data: existingItem } = await existingQuery.maybeSingle();

  if (existingItem) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id);
      
    if (error) return { error: "Gagal update keranjang." };

    revalidatePath("/cart");
    return { success: true, cartItemId: existingItem.id };
  } else {
    const { data: newItem, error } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cart.id,
        product_id: productId,
        quantity: quantity,
        selected_variant_id: variantId || null,
      })
      .select("id")
      .single();
      
    if (error) return { error: "Gagal menambah item ke keranjang." };

    revalidatePath("/cart");
    return { success: true, cartItemId: newItem.id };
  }
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

export async function checkoutCart(
  shippingCosts?: Record<string, number>,
  storeNotes?: Record<string, string>,
  selectedItemIds?: string[],
  addressId?: string,
  selectedShipping?: Record<string, string>
) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: cart } = await supabase
    .from("carts")
    .select(`
      id,
      cart_items (
        id,
        quantity,
        product_id,
        selected_variant_id,
        products (
          id, type, price, store_id, name,
          price_options (id, price)
        )
      )
    `)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
    return { error: "Keranjang kosong" };
  }

  // Filter hanya item yang dipilih saat checkout (jika ada)
  const itemsToCheckout = selectedItemIds && selectedItemIds.length > 0
    ? cart.cart_items.filter((item: any) => selectedItemIds.includes(item.id))
    : cart.cart_items;

  if (itemsToCheckout.length === 0) {
    return { error: "Tidak ada item yang valid untuk di-checkout" };
  }

  // Upsert ke buyers table untuk mencegah foreign key error
  const { data: buyerExists } = await supabase.from("buyers").select("id").eq("id", user.id).maybeSingle();
  if (!buyerExists) {
    await supabase.from("buyers").insert({ id: user.id });
  }

  // Fetch address snapshot (simpan ke order agar tidak berubah jika user edit alamat nanti)
  let shippingName = "";
  let shippingPhone = "";
  let shippingAddressStr = "";

  if (addressId) {
    const { data: addr } = await supabase.from("addresses").select("*").eq("id", addressId).maybeSingle();
    if (addr) {
      shippingName = addr.recipient_name || "";
      shippingPhone = addr.phone || "";
      shippingAddressStr = addr.address || "";
    }
  }

  if (!shippingName || !shippingPhone || !shippingAddressStr) {
    const [{ data: acc }, { data: buy }] = await Promise.all([
      supabase.from("accounts").select("name, address").eq("id", user.id).maybeSingle(),
      supabase.from("buyers").select("phone").eq("id", user.id).maybeSingle()
    ]);
    if (!shippingName) shippingName = acc?.name || "";
    if (!shippingPhone) shippingPhone = buy?.phone || "";
    if (!shippingAddressStr) shippingAddressStr = acc?.address || "";
  }

  const storeOrders: Record<string, any[]> = {};
  // Track which cart_item IDs were successfully processed
  const processedCartItemIds: string[] = [];
  
  for (const item of itemsToCheckout) {
    const product = item.products as any;
    if (!product || !product.store_id) continue;
    
    if (!storeOrders[product.store_id]) {
      storeOrders[product.store_id] = [];
    }
    
    let price = 0;
    if (product.type === 1 && item.selected_variant_id && product.price_options) {
      const opt = product.price_options.find((o: any) => o.id === item.selected_variant_id);
      price = opt?.price || 0;
    } else {
      price = product.price || 0;
    }

    storeOrders[product.store_id].push({
      cart_item_id: item.id,
      product_id: product.id,
      quantity: item.quantity,
      selected_variant_id: item.selected_variant_id,
      price: price
    });
    processedCartItemIds.push(item.id);
  }

  if (Object.keys(storeOrders).length === 0) {
    return { error: "Gagal checkout: Produk tidak memiliki informasi toko (store_id) yang valid." };
  }

  const createdOrderIds = [];

  for (const storeId in storeOrders) {
    const items = storeOrders[storeId];
    const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const shippingCost = shippingCosts?.[storeId] ?? 15000;
    const noteForStore = storeNotes?.[storeId] || null;
    const shippingMethodId = selectedShipping?.[storeId] || "gosend";
    
    // Map ID to readable name for database
    const methodNames: Record<string, string> = {
      "gosend": "Ojol",
      "ambil": "Ambil Sendiri",
      "penjual": "Dianterin Penjual"
    };
    const shippingMethodName = methodNames[shippingMethodId] || shippingMethodId;
    
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        store_id: storeId,
        status: "Menunggu Konfirmasi",
        total_amount: totalAmount,
        shipping_cost: shippingCost,
        shipping_method: shippingMethodName,
        notes: noteForStore,
        shipping_name: shippingName,
        shipping_phone: shippingPhone,
        shipping_address: shippingAddressStr,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error(orderError);
      return { error: `Gagal membuat pesanan: ${orderError?.message || 'Unknown'}` };
    }

    createdOrderIds.push(order.id);

    const orderItemsData = items.map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      selected_variant_id: i.selected_variant_id,
      price: i.price
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) {
      console.error(itemsError);
      return { error: `Gagal menambahkan item pesanan: ${itemsError?.message || 'Unknown'}` };
    }

    // Kurangi stok produk setelah order berhasil dibuat
    for (const i of items) {
      const { data: productStock } = await supabase
        .from("products")
        .select("stock")
        .eq("id", i.product_id)
        .maybeSingle();

      if (productStock && productStock.stock !== null) {
        const newStock = Math.max(0, productStock.stock - i.quantity);
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", i.product_id);
      }
    }

    // Ambil seller_id dari store untuk kirim notifikasi
    const { data: storeData } = await supabase
      .from("stores")
      .select("seller_id")
      .eq("id", storeId)
      .maybeSingle();

    if (storeData && storeData.seller_id) {
      await supabase.from("notifications").insert({
        user_id: storeData.seller_id,
        title: "Pesanan Baru!",
        message: `Ada pesanan baru sejumlah ${formatPrice(totalAmount)}. Silakan periksa halaman pesanan.`,
        link: `/dashboard/orders/${order.id}`
      });
    }
  }

  // Hapus hanya cart items yang sudah di-checkout (bukan seluruh keranjang)
  if (processedCartItemIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .in("id", processedCartItemIds);

    if (deleteError) {
      console.error("Gagal menghapus cart items:", deleteError);
    }
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { success: true, orderIds: createdOrderIds };
}

export async function buyNow(productId: string, quantity: number, variantId?: string) {
  await clearCart();
  const result = await addToCart(productId, quantity, variantId);
  if (result.error) return { error: result.error };
  return { success: true, cartItemId: result.cartItemId };
}