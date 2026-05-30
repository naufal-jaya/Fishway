import Container from "@/components/Container";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CheckoutClient from "@/components/CheckoutClient";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { items?: string };
}) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Fetch addresses pembeli
  const { data: addressesData } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  const addresses = (addressesData || []) as {
    id: string;
    label: string;
    recipient_name: string;
    phone: string;
    address: string;
    lat?: number | null;
    lon?: number | null;
    is_primary: boolean;
  }[];

  // Fetch Cart (sertakan store_id dari products)
  const { data: cart } = await supabase
    .from("carts")
    .select(`
      id,
      cart_items (
        id,
        quantity,
        products (
          id, name, type, price, unit, store_id
        ),
        price_options (
          id, label, price
        )
      )
    `)
    .eq("buyer_id", user.id)
    .maybeSingle();

  const cartItems = cart?.cart_items || [];

  // Filter berdasarkan item IDs yang dipilih dari keranjang (?items=id1,id2,...)
  const selectedIdsParam = searchParams.items || "";
  const selectedIds = selectedIdsParam
    ? new Set(selectedIdsParam.split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  // Kalau tidak ada filter (user akses /checkout langsung tanpa dari keranjang), redirect ke cart
  if (!selectedIds || selectedIds.size === 0) {
    redirect("/cart");
  }

  const filteredItems = selectedIds
    ? cartItems.filter((item: any) => selectedIds.has(item.id))
    : cartItems;

  if (filteredItems.length === 0) {
    redirect("/cart");
  }

  // Kumpulkan ID cart items yang akan di-checkout (untuk dihapus dari keranjang setelah checkout)
  const selectedItemIdsList = filteredItems.map((item: any) => item.id);

  const formattedItems = filteredItems.map((item: any) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const variant = Array.isArray(item.price_options) ? item.price_options[0] : item.price_options;

    const itemPrice = product?.type === 0 ? product.price : variant?.price || 0;
    const storeId = product?.store_id;

    return {
      id: item.id,
      name: product?.name || "Produk",
      qty: item.quantity,
      price: itemPrice,
      storeId,
    };
  });

  // Get unique store IDs from items
  const uniqueStoreIds = Array.from(new Set(formattedItems.map(item => item.storeId).filter(Boolean))) as string[];

  // Fetch store details (name, address, lat, lon, max_distance, shipping methods) for these store IDs
  const storesData = [];
  if (uniqueStoreIds.length > 0) {
    const { data, error } = await supabase
      .from("stores")
      .select("id, name, address, lat, lon, max_distance, shipping_ojol, shipping_ambil, shipping_penjual")
      .in("id", uniqueStoreIds);
      
    if (error) {
      console.error("Error fetching checkout stores:", error.message);
    }
    if (data) {
      storesData.push(...data);
    }
  }

  const stores = storesData.map((store) => ({
    id: store.id,
    name: store.name,
    address: store.address,
    lat: store.lat,
    lon: store.lon,
    max_distance: store.max_distance != null ? store.max_distance : 10,
    shipping_ojol: store.shipping_ojol ?? true,
    shipping_ambil: store.shipping_ambil ?? true,
    shipping_penjual: store.shipping_penjual ?? true,
  }));

  const SHIPPING_OPTIONS = [
    { id: "gosend", label: "Ojol", price: 0, desc: "Ongkir dibayar terpisah", maxKm: 10 },
    { id: "ambil", label: "Ambil Sendiri", price: 0, desc: "Ambil langsung ke toko" },
    { id: "penjual", label: "Dianterin Penjual", price: 15000, desc: "Dikirim langsung oleh penjual", maxKm: 10 },
  ];

  return (
    <div>
      <Navbar />
      <Container>
        <CheckoutClient
          addresses={addresses}
          items={formattedItems}
          stores={stores}
          shippingOptions={SHIPPING_OPTIONS}
          selectedItemIds={selectedItemIdsList}
        />
      </Container>
    </div>
  );
}
